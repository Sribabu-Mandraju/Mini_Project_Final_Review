import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import toast from "react-hot-toast";

import CampaignABI from "../abis/campaign.json";
import ERC20ABI from "../abis/erc20.json";
import { BACKEND_API_URL } from "../shared/contractConfig";
import { getShortDonationError } from "../utils/donationErrors.js";

// USDC typically has 6 decimals
const USDC_DECIMALS = 6;

const parseUSDC = (amountInDollars) =>
  BigInt(Math.floor(Number(amountInDollars) * 10 ** USDC_DECIMALS));

const formatUSDC = (raw) => Number(raw) / 10 ** USDC_DECIMALS;

const STEP = {
  IDLE: "idle",
  APPROVING: "approving",
  DONATING: "donating",
};

/**
 * Hook to donate USDC directly to a specific campaign contract using the
 * Campaign ABI's `donate(uint256 amount)` function.
 *
 * - Reads MIN_DONATION, USDC address and totalFunds from the campaign.
 * - Performs ERC20.approve(campaign, amount) then campaign.donate(amount).
 * - Optionally notifies caller via onDonated callback with the numeric amount (in dollars).
 */
export const useCampaignDonate = (campaignAddress, { onDonated } = {}) => {
  const [error, setError] = useState(null);
  const [step, setStep] = useState(STEP.IDLE);
  const pendingAmountRef = useRef(null); // store raw amount (BigInt) for second tx
  const pendingDonationIdRef = useRef(null);

  const { address: donorAddress } = useAccount();

  const isValidAddress =
    campaignAddress && /^0x[a-fA-F0-9]{40}$/.test(campaignAddress);

  // Read USDC token address from campaign
  const { data: usdcAddress } = useReadContract({
    address: isValidAddress ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "USDC",
  });

  // Read min donation (raw amount in USDC base units)
  const { data: minDonationRaw } = useReadContract({
    address: isValidAddress ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "MIN_DONATION",
  });

  // Read total funds already donated to this campaign (raw)
  const { data: totalFundsRaw, refetch: refetchTotalFunds } = useReadContract({
    address: isValidAddress ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "totalFunds",
  });

  const {
    writeContract,
    data: hash,
    isPending: isPendingWrite,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const minDonation =
    minDonationRaw != null ? formatUSDC(minDonationRaw) : null;

  const totalFunds = totalFundsRaw != null ? formatUSDC(totalFundsRaw) : null;

  /**
   * Donate a given amount (in whole USDC dollars, e.g. "10" or "25.5").
   */
  const donate = (amountInDollars) => {
    const num = Number(amountInDollars);
    if (!Number.isFinite(num) || num <= 0) {
      const msg = "Please enter a valid donation amount.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const min = minDonation != null ? Number(minDonation) : 0;
    if (min > 0 && num < min) {
      const msg = `Minimum donation is ${minDonation} USDC.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!donorAddress) {
      const msg = "Connect your wallet to donate.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!isValidAddress) {
      const msg = "Invalid campaign contract address.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!usdcAddress) {
      const msg = "USDC token address not loaded yet. Please try again.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const amountRaw = parseUSDC(amountInDollars);
    if (amountRaw === 0n) {
      const msg = "Amount is too small.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    pendingAmountRef.current = amountRaw;

    // Create a pending donation record in the backend for portfolio tracking
    (async () => {
      try {
        const res = await fetch(`${BACKEND_API_URL}/donations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorAddress,
            amount: amountInDollars,
            amountWei: amountRaw.toString(),
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.donation?.id) {
          pendingDonationIdRef.current = data.data.donation.id;
        }
      } catch {
        // backend failure should not block on-chain donation
      }

      // First tx: approve campaign to spend USDC
      setStep(STEP.APPROVING);
      writeContract({
        address: usdcAddress,
        abi: ERC20ABI,
        functionName: "approve",
        args: [campaignAddress, amountRaw],
      });
    })();
  };

  // When the approve tx confirms, send the donate tx.
  useEffect(() => {
    if (!isConfirmed || !hash) return;

    if (step === STEP.APPROVING) {
      const amountRaw = pendingAmountRef.current;
      if (!amountRaw) {
        setStep(STEP.IDLE);
        return;
      }

      setStep(STEP.DONATING);
      writeContract({
        address: campaignAddress,
        abi: CampaignABI,
        functionName: "donate",
        args: [amountRaw],
      });
      return;
    }

    if (step === STEP.DONATING) {
      // Donate success
      const donatedRaw = pendingAmountRef.current;
      const donatedDollars = donatedRaw != null ? formatUSDC(donatedRaw) : null;
      setStep(STEP.IDLE);
      pendingAmountRef.current = null;
      refetchTotalFunds();
      if (onDonated && donatedDollars != null) {
        onDonated(donatedDollars);
      }

      toast.success("Donation successful. Thank you!");

      // Update backend record as success
      const id = pendingDonationIdRef.current;
      if (id) {
        fetch(`${BACKEND_API_URL}/donations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionHash: hash, status: "success" }),
        }).catch(() => {});
        pendingDonationIdRef.current = null;
      }
    }
  }, [
    isConfirmed,
    hash,
    step,
    campaignAddress,
    writeContract,
    refetchTotalFunds,
    onDonated,
  ]);

  // Handle errors from either write or receipt
  useEffect(() => {
    const msg = receiptError?.message || writeError?.message;
    if (msg) {
      setStep(STEP.IDLE);
      const short = getShortDonationError(msg);
      setError(short);
      toast.error(short);

      const id = pendingDonationIdRef.current;
      if (id) {
        fetch(`${BACKEND_API_URL}/donations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "failed",
            rawErrorMessage: msg,
          }),
        }).catch(() => {});
        pendingDonationIdRef.current = null;
      }
    }
  }, [receiptError, writeError]);

  const statusMessage =
    step === STEP.APPROVING
      ? "Approving USDC…"
      : step === STEP.DONATING
      ? "Donating…"
      : isPendingWrite || isConfirming
      ? "Confirming…"
      : null;

  return {
    donate,
    minDonation,
    totalFunds,
    refetchTotalFunds,
    hash,
    isPending: isPendingWrite,
    isConfirming,
    isConfirmed,
    error,
    step,
    statusMessage,
  };
};
