import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import toast from "react-hot-toast";
import { decodeEventLog } from "viem";

import DaoGovernanceABI from "../abis/DaoGovernance.json";
import {
  DAO_GOVERNANCE_CONTRACT_ADDRESS,
  BACKEND_API_URL,
} from "../shared/contractConfig";

const normalizeErrorMessage = (message) => {
  if (!message) {
    return "Something went wrong. Please try again.";
  }

  const lower = message.toLowerCase();

  if (lower.includes("user denied") || lower.includes("user rejected")) {
    return "Transaction was cancelled.";
  }

  return message;
};

// USDC on Base has 6 decimals
const USDC_DECIMALS = 6;

const toUSDCBaseUnits = (amount) => {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return null;
  // Convert e.g. "5" → 5_000_000 base units
  return BigInt(Math.round(num * 10 ** USDC_DECIMALS));
};

/**
 * Hook to create a proposal on-chain and persist full campaign data to backend
 */
export const useCreateProposal = () => {
  const { address: proposerAddress } = useAccount();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const campaignRef = useRef(null);

  const {
    writeContract,
    data: hash,
    isPending: isPendingTransaction,
    error: contractError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const verifyAndSaveProposal = async (transactionHash, onChainProposalId) => {
    if (!campaignRef.current) return;

    setIsVerifying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const {
        disasterName,
        description,
        fundsRequested,
        locationSearch,
        locationDisplayName,
        latitude,
        longitude,
        radius,
        addressLine,
        imageUrl,
        ipfsMetadataUri,
        pincodes,
      } = campaignRef.current;

      const response = await fetch(`${BACKEND_API_URL}/proposals/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionHash,
          onChainProposalId,
          proposerAddress,
          campaignTitle: disasterName,
          campaignMetadataUri: ipfsMetadataUri,
          fundsRequested,
          campaign: {
            disasterName,
            description,
            locationSearch,
            locationDisplayName,
            latitude,
            longitude,
            radius,
            addressLine,
            imageUrl,
            ipfsMetadataUri,
            pincodes,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Backend verification failed");
      }

      const message =
        data?.message || "Proposal created and saved successfully";
      setSuccessMessage(message);
      toast.success(message);

      return data;
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to verify proposal with backend",
      );
      setError(normalized);
      toast.error(normalized);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  const createProposal = async (campaignPayload) => {
    if (!proposerAddress) {
      const msg = "Connect your wallet to create a proposal.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    const { disasterName, ipfsMetadataUri, fundsRequested } = campaignPayload;

    if (!disasterName || !ipfsMetadataUri) {
      const msg =
        "Disaster name and IPFS metadata URI are required before creating a proposal.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    const numericFunds = Number(fundsRequested);
    if (!Number.isFinite(numericFunds) || numericFunds <= 0) {
      const msg = "Funds requested must be a positive number.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    // Convert human amount (e.g. "5" USDC) to base units for the contract.
    const fundsUint256 = toUSDCBaseUnits(numericFunds);
    if (fundsUint256 === null) {
      const msg = "Invalid fundsRequested value.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    campaignRef.current = campaignPayload;

    try {
      await writeContract({
        address: DAO_GOVERNANCE_CONTRACT_ADDRESS,
        abi: DaoGovernanceABI,
        functionName: "createProposal",
        args: [disasterName, ipfsMetadataUri, fundsUint256],
      });
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to initiate proposal transaction",
      );
      setError(normalized);
      toast.error(normalized);
      setIsSubmitting(false);
      campaignRef.current = null;
      throw err;
    }
  };

  useEffect(() => {
    if (isConfirmed && hash && campaignRef.current) {
      let proposalIdFromChain = null;

      const contractAddr = (
        DAO_GOVERNANCE_CONTRACT_ADDRESS || ""
      ).toLowerCase();
      const logs = receipt?.logs || [];

      for (const log of logs) {
        // Only try decoding logs emitted by the governance contract
        if (contractAddr && log?.address?.toLowerCase?.() !== contractAddr) {
          continue;
        }

        try {
          const decoded = decodeEventLog({
            abi: DaoGovernanceABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded?.eventName === "ProposalCreated") {
            proposalIdFromChain =
              decoded.args?.proposalId?.toString?.() ?? null;
            break;
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (!proposalIdFromChain) {
        toast.error(
          "Couldn’t read the proposal id from chain. This proposal won’t be votable until it’s synced.",
        );
      }

      verifyAndSaveProposal(hash, proposalIdFromChain)
        .then(() => {
          setIsSubmitting(false);
          campaignRef.current = null;
        })
        .catch(() => {
          setIsSubmitting(false);
        });
    }

    if (receiptError || contractError) {
      const normalized = normalizeErrorMessage(
        receiptError?.message || contractError?.message || "Transaction failed",
      );
      setError(normalized);
      toast.error(normalized);
      setIsSubmitting(false);
      campaignRef.current = null;
    }
  }, [isConfirmed, hash, receipt, receiptError, contractError]);

  return {
    createProposal,
    hash,
    isPending: isPendingTransaction || isSubmitting,
    isConfirming,
    isConfirmed,
    isVerifying,
    successMessage,
    error,
  };
};
