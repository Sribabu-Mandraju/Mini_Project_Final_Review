import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import toast from "react-hot-toast";

import CampaignABI from "../abis/campaign.json";
import { BACKEND_API_URL } from "../shared/contractConfig";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

const formatUSDC = (raw) =>
  (Number(raw) / 10 ** USDC_DECIMALS).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const isAddress = (addr) =>
  typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);

const normalizeErrorMessage = (message) => {
  if (!message) {
    return "Something went wrong. Please try again.";
  }

  const lower = message.toLowerCase();

  if (lower.includes("user denied") || lower.includes("user rejected")) {
    return "Transaction was cancelled.";
  }

  if (lower.includes("insufficient") && lower.includes("funds")) {
    return "Insufficient funds in your wallet.";
  }

  return "Unable to complete transaction. Please try again.";
};

/**
 * Hook to claim relief funds from a specific Campaign contract.
 * - Calls campaign.claimFund()
 * - After success, syncs fundsDistributed in the backend so "available funds"
 *   in the campaign card stays up-to-date.
 */
export const useClaimFund = (campaignAddress) => {
  const { address } = useAccount();
  const [error, setError] = useState(null);

  const isValidCampaign = isAddress(campaignAddress);

  const { data: amountPerVictimRaw } = useReadContract({
    address: isValidCampaign ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "amountPerVictim",
  });

  const { data: totalFundsRaw, refetch: refetchTotalFunds } = useReadContract({
    address: isValidCampaign ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "totalFunds",
  });

  const {
    data: distributedFundsRaw,
    refetch: refetchDistributedFunds,
  } = useReadContract({
    address: isValidCampaign ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "distributedFunds",
  });

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  const amountPerVictimHuman =
    amountPerVictimRaw != null
      ? Number(amountPerVictimRaw) / 10 ** USDC_DECIMALS
      : null;

  const totalFunds = useMemo(
    () =>
      totalFundsRaw != null
        ? Number(totalFundsRaw) / 10 ** USDC_DECIMALS
        : null,
    [totalFundsRaw],
  );
  const distributedFunds = useMemo(
    () =>
      distributedFundsRaw != null
        ? Number(distributedFundsRaw) / 10 ** USDC_DECIMALS
        : null,
    [distributedFundsRaw],
  );

  const availableOnChain =
    totalFunds != null && distributedFunds != null
      ? Math.max(0, totalFunds - distributedFunds)
      : null;

  const claim = () => {
    setError(null);

    if (!address) {
      const msg = "Connect your wallet to claim funds.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!isValidCampaign) {
      const msg = "Invalid campaign contract address.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Debug: log how we are interacting with the contract so we can inspect
    // msg.sender (wallet), contract address, and expected amount.
    // eslint-disable-next-line no-console
    console.log("[claimFund] sending tx", {
      campaignAddress,
      walletAddress: address,
      amountPerVictimHuman,
      totalFunds,
      distributedFunds,
      availableOnChain,
    });

    writeContract({
      address: campaignAddress,
      abi: CampaignABI,
      functionName: "claimFund",
      args: [],
    });
  };

  useEffect(() => {
    const raw = writeError?.message;
    if (raw) {
      const msg = normalizeErrorMessage(raw);
      setError(msg);
      toast.error(msg);
    }
  }, [writeError]);

  useEffect(() => {
    if (!isConfirmed || !hash) return;

    // After successful claim:
    toast.success("Relief funds claimed successfully.");
    refetchTotalFunds();
    refetchDistributedFunds();

    // Sync with backend so available funds in DB stay current
    if (amountPerVictimHuman != null && isFinite(amountPerVictimHuman)) {
      fetch(
        `${BACKEND_API_URL}/campaigns/address/${campaignAddress}/funds-distributed`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountPerVictimHuman }),
        },
      ).catch(() => {});
    }
  }, [
    isConfirmed,
    hash,
    campaignAddress,
    amountPerVictimHuman,
    refetchTotalFunds,
    refetchDistributedFunds,
  ]);

  const statusMessage =
    isPending || isConfirming ? "Claim transaction in progress…" : null;

  return {
    claim,
    amountPerVictimRaw,
    amountPerVictimFormatted:
      amountPerVictimRaw != null ? formatUSDC(amountPerVictimRaw) : null,
    totalFunds,
    distributedFunds,
    availableOnChain,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    statusMessage,
  };
};
