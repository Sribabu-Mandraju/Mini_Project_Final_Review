import { useState, useEffect, useRef } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import toast from "react-hot-toast";

import EscrowABI from "../abis/Escrow.json";
import ERC20ABI from "../abis/erc20.json";
import { BACKEND_API_URL } from "../shared/contractConfig";
import { getShortDonationError } from "../utils/donationErrors.js";

const ESCROW_CONTRACT_ADDRESS =
  import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS;

/** USDC has 6 decimals */
const USDC_DECIMALS = 6;
const parseUSDC = (amountInDollars) =>
  BigInt(Math.floor(Number(amountInDollars) * 10 ** USDC_DECIMALS));

const formatUSDC = (raw) =>
  (Number(raw) / 10 ** USDC_DECIMALS).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const STEP = {
  IDLE: "idle",
  APPROVING: "approving",
  DONATING: "donating",
};

/**
 * Hook to donate USDC to the Escrow contract and read escrow balance / min donation.
 * Records each attempt in the backend and shows short, user-friendly errors.
 */
export const useEscrowDonate = () => {
  const [error, setError] = useState(null);
  const [step, setStep] = useState(STEP.IDLE);
  const pendingDonationIdRef = useRef(null);
  const pendingAmountWeiRef = useRef(null);

  const { address: donorAddress } = useAccount();

  // USDC token address from Escrow contract
  const { data: usdcAddress } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: EscrowABI,
    functionName: "USDC",
  });

  const { data: balanceRaw, refetch: refetchBalance } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: EscrowABI,
    functionName: "getBalance",
  });

  const { data: minDonationRaw } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: EscrowABI,
    functionName: "MIN_DONATION",
  });

  const {
    writeContract,
    data: hash,
    isPending: isPendingTransaction,
    error: contractError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const balance = balanceRaw != null ? formatUSDC(balanceRaw) : null;
  const minDonation =
    minDonationRaw != null ? formatUSDC(minDonationRaw) : null;

  /**
   * Donate USDC to the escrow contract.
   * First: USDC.approve(escrow, amount)
   * Then: Escrow.donate(amount)
   * @param {string} amountInDollars - Amount in dollars (e.g. "10.00")
   */
  const donate = (amountInDollars) => {
    const num = Number(amountInDollars);
    if (!Number.isFinite(num) || num <= 0) {
      const err = "Please enter a valid donation amount.";
      setError(err);
      toast.error(err);
      return;
    }

    const min = minDonation != null ? Number(minDonation) : 0;
    if (min > 0 && num < min) {
      const err = `Minimum donation is $${minDonation} USDC.`;
      setError(err);
      toast.error(err);
      return;
    }

    setError(null);
    const amountWei = parseUSDC(amountInDollars);
    if (amountWei === 0n) {
      const err = "Amount is too small.";
      setError(err);
      toast.error(err);
      return;
    }

    if (!donorAddress) {
      setError("Connect your wallet to donate.");
      toast.error("Connect your wallet to donate.");
      return;
    }

    if (!usdcAddress) {
      setError("USDC contract not loaded yet. Please try again.");
      toast.error("USDC contract not loaded yet. Please try again.");
      return;
    }

    pendingAmountWeiRef.current = amountWei;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_API_URL}/donations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorAddress,
            amount: amountInDollars,
            amountWei: amountWei.toString(),
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.donation?.id) {
          pendingDonationIdRef.current = data.data.donation.id;
        }
      } catch {
        // ignore backend error, still do on-chain flow
      }

      setStep(STEP.APPROVING);
      writeContract({
        address: usdcAddress,
        abi: ERC20ABI,
        functionName: "approve",
        args: [ESCROW_CONTRACT_ADDRESS, amountWei],
      });
    })();
  };

  useEffect(() => {
    if (!isConfirmed || !hash) return;

    // After approve confirms, send donate tx
    if (step === STEP.APPROVING) {
      const amountWei = pendingAmountWeiRef.current;
      if (!amountWei) {
        setStep(STEP.IDLE);
        return;
      }

      setStep(STEP.DONATING);
      writeContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: EscrowABI,
        functionName: "donate",
        args: [amountWei],
      });
      return;
    }

    // After donate confirms, mark success
    if (step === STEP.DONATING) {
      setError(null);
      setStep(STEP.IDLE);
      refetchBalance();
      toast.success("Donation successful. Thank you!");
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
  }, [isConfirmed, hash, step, refetchBalance, writeContract]);

  useEffect(() => {
    const msg = receiptError?.message || contractError?.message;
    if (msg) {
      setStep(STEP.IDLE);
      const shortMessage = getShortDonationError(msg);
      setError(shortMessage);
      toast.error(shortMessage);
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
  }, [receiptError, contractError]);

  const statusMessage =
    step === STEP.APPROVING
      ? "Approving USDC…"
      : step === STEP.DONATING
        ? "Donating…"
        : isPendingTransaction || isConfirming
          ? "Confirming…"
          : null;

  return {
    donate,
    balance,
    minDonation,
    refetchBalance,
    hash,
    isPending: isPendingTransaction,
    isConfirming,
    isConfirmed,
    error,
    step,
    statusMessage,
  };
};
