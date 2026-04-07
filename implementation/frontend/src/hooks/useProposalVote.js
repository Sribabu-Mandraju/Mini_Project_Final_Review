import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import toast from "react-hot-toast";

import DaoGovernanceABI from "../abis/DaoGovernance.json";
import {
  DAO_GOVERNANCE_CONTRACT_ADDRESS,
  BACKEND_API_URL,
} from "../shared/contractConfig";

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong. Please try again.";

  const lower = message.toLowerCase();

  if (lower.includes("user denied") || lower.includes("user rejected")) {
    return "Transaction was cancelled.";
  }
  if (lower.includes("already voted")) {
    return "You already voted on this one.";
  }
  if (lower.includes("proposal not active")) {
    return "This proposal isn’t active right now.";
  }
  if (lower.includes("voting period has ended")) {
    return "Voting is closed for this proposal.";
  }

  return message;
};

/**
 * Vote on a proposal (onlyDAOMember) and sync votes to backend.
 * @param {string|number|bigint} proposalId on-chain proposal id
 * @param {{ onVotePersisted?: (proposal: any) => void }} options
 */
export const useProposalVote = (proposalId, options = {}) => {
  const { onVotePersisted } = options;
  const { address } = useAccount();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastSupport, setLastSupport] = useState(null);
  const [hasSynced, setHasSynced] = useState(false);

  const {
    writeContract,
    data: hash,
    isPending,
    error: contractError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const vote = async (support) => {
    if (proposalId === null || proposalId === undefined || proposalId === "") {
      const msg = "This proposal isn’t synced on-chain yet.";
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
    setLastSupport(support);
    setHasSynced(false);

    try {
      writeContract({
        address: DAO_GOVERNANCE_CONTRACT_ADDRESS,
        abi: DaoGovernanceABI,
        functionName: "vote",
        args: [BigInt(String(proposalId)), support],
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

  useEffect(() => {
    const errMsg = receiptError?.message || contractError?.message;
    if (errMsg) {
      const normalized = normalizeErrorMessage(errMsg);
      setError(normalized);
      toast.error(normalized);
    }
  }, [receiptError, contractError]);

  useEffect(() => {
    if (
      !isConfirmed ||
      !hash ||
      !proposalId ||
      lastSupport === null ||
      hasSynced
    ) {
      return;
    }

    const syncVote = async () => {
      try {
        const response = await fetch(
          `${BACKEND_API_URL}/proposals/vote/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionHash: hash,
              onChainProposalId: proposalId,
              support: lastSupport,
              voterAddress: address,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Backend vote verification failed");
        }

        const msg = "Vote confirmed and recorded.";
        setSuccessMessage(msg);
        toast.success(msg);

        if (typeof onVotePersisted === "function" && data.data?.proposal) {
          onVotePersisted(data.data.proposal);
        }
      } catch (err) {
        const normalized = normalizeErrorMessage(
          err.message || "Failed to sync vote with backend",
        );
        setError(normalized);
        toast.error(normalized);
      } finally {
        setHasSynced(true);
      }
    };

    syncVote();
  }, [
    isConfirmed,
    hash,
    proposalId,
    lastSupport,
    address,
    hasSynced,
    onVotePersisted,
  ]);

  return {
    vote,
    voteYes: () => vote(true),
    voteNo: () => vote(false),
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    successMessage,
  };
};
