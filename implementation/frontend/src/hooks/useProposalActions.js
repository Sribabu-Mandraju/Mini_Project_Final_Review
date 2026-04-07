import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import toast from "react-hot-toast";

import DaoGovernanceABI from "../abis/DaoGovernance.json";
import { DAO_GOVERNANCE_CONTRACT_ADDRESS } from "../shared/contractConfig";

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

export const useProposalActions = (proposalId) => {
  const { address } = useAccount();
  const isValidProposalId =
    proposalId !== null && proposalId !== undefined && proposalId !== "";

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const {
    writeContract,
    data: txHash,
    isPending,
    error: contractError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleResult = (actionLabel) => {
    if (isConfirmed) {
      const msg = `${actionLabel} transaction confirmed on-chain.`;
      setSuccessMessage(msg);
      toast.success(msg);
    } else if (contractError) {
      const normalized = normalizeErrorMessage(contractError.message);
      setError(normalized);
      toast.error(normalized);
    }
  };

  const vote = async (support) => {
    if (!isValidProposalId) {
      const msg = "This proposal isn’t synced to the chain yet.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }
    if (!address) {
      const msg = "Connect your wallet to vote.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await writeContract({
        address: DAO_GOVERNANCE_CONTRACT_ADDRESS,
        abi: DaoGovernanceABI,
        functionName: "vote",
        args: [BigInt(proposalId), support],
      });
      toast.success(support ? "Casting a YES vote..." : "Casting a NO vote...");
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to send vote transaction",
      );
      setError(normalized);
      toast.error(normalized);
      throw err;
    }
  };

  const executeProposal = async (proposal, options) => {
    if (!isValidProposalId) {
      const msg = "This proposal isn’t synced to the chain yet.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }
    if (!address) {
      const msg = "Connect your wallet as operator to create a campaign.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    const {
      donationPeriod = 7 * 24 * 60 * 60,
      registrationPeriod = 7 * 24 * 60 * 60,
      waitingPeriod = 3 * 24 * 60 * 60,
      distributionPeriod = 14 * 24 * 60 * 60,
    } = options || {};

    const pincodes =
      proposal.campaign?.pincodes
        ?.map((p) => {
          const numeric = parseInt(p, 10);
          return Number.isFinite(numeric) ? numeric : null;
        })
        .filter((p) => p !== null) ?? [];

    const details = {
      campaignId: 0n,
      title: proposal.campaignTitle,
      descriptionURI: proposal.campaignMetadataUri,
      pincodes,
      state: 0, // initial enum state
    };

    setError(null);
    setSuccessMessage(null);

    try {
      await writeContract({
        address: DAO_GOVERNANCE_CONTRACT_ADDRESS,
        abi: DaoGovernanceABI,
        functionName: "extecuteProposal",
        args: [
          BigInt(proposalId),
          details,
          BigInt(donationPeriod),
          BigInt(registrationPeriod),
          BigInt(waitingPeriod),
          BigInt(distributionPeriod),
        ],
      });
      toast.success("Triggering campaign creation for this proposal...");
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to execute proposal",
      );
      setError(normalized);
      toast.error(normalized);
      throw err;
    }
  };

  // Expose a simple way for components to read latest status
  const syncStatus = (actionLabel) => handleResult(actionLabel);

  return {
    vote,
    executeProposal,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    successMessage,
    syncStatus,
  };
};
