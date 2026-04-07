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

/**
 * Hook to execute a proposal (create campaign) on-chain and persist campaign data to backend
 */
export const useCreateCampaign = () => {
  const { address: operatorAddress } = useAccount();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const executionDataRef = useRef(null);

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

  const verifyAndSaveCampaign = async (
    transactionHash,
    onChainProposalId,
    campaignAddress,
  ) => {
    if (!executionDataRef.current) return;

    setIsVerifying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const {
        donationPeriod,
        registrationPeriod,
        waitingPeriod,
        distributionPeriod,
      } = executionDataRef.current;

      const response = await fetch(`${BACKEND_API_URL}/campaigns/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionHash,
          onChainProposalId,
          campaignAddress,
          donationPeriod,
          registrationPeriod,
          waitingPeriod,
          distributionPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Backend verification failed");
      }

      const message =
        data?.message || "Campaign created and saved successfully";
      setSuccessMessage(message);
      toast.success(message);

      return data;
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to verify campaign with backend",
      );
      setError(normalized);
      toast.error(normalized);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  const createCampaign = async (proposal, options = {}) => {
    if (!operatorAddress) {
      const msg = "Connect your wallet as operator to create a campaign.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    if (!proposal?.onChainProposalId) {
      const msg = "This proposal isn't synced on-chain yet.";
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    // Refresh and check proposal state from backend before executing
    try {
      // First, trigger a state check/update
      const checkStateResponse = await fetch(
        `${BACKEND_API_URL}/proposals/${
          proposal._id || proposal.id
        }/check-state`,
        {
          method: "POST",
        },
      );

      // Then get the latest proposal data
      const refreshResponse = await fetch(
        `${BACKEND_API_URL}/proposals/${proposal._id || proposal.id}`,
      );
      const refreshData = await refreshResponse.json();

      if (refreshData.success && refreshData.data?.proposal) {
        const refreshedProposal = refreshData.data.proposal;
        if (refreshedProposal.state !== "Passed") {
          const msg = `Proposal must be in "Passed" state to execute. Current state: ${refreshedProposal.state}. Votes: ${refreshedProposal.forVotes} for, ${refreshedProposal.againstVotes} against.`;
          setError(msg);
          toast.error(msg);
          throw new Error(msg);
        }
        // Use refreshed proposal data
        proposal = refreshedProposal;
      }
    } catch (refreshError) {
      // If refresh fails, still check original proposal state
      if (proposal.state !== "Passed") {
        const msg = `Proposal must be in "Passed" state to execute. Current state: ${proposal.state}. Please ensure the proposal has enough votes.`;
        setError(msg);
        toast.error(msg);
        throw new Error(msg);
      }
    }

    const FIVE_MINUTES = 5 * 60;

    // const {
    //   donationPeriod = 7 * 24 * 60 * 60, // 7 days in seconds
    //   registrationPeriod = 7 * 24 * 60 * 60, // 7 days
    //   waitingPeriod = 3 * 24 * 60 * 60, // 3 days
    //   distributionPeriod = 14 * 24 * 60 * 60, // 14 days
    // } = options;

    const {
      donationPeriod = FIVE_MINUTES, // 7 days in seconds
      registrationPeriod = FIVE_MINUTES, // 7 days
      waitingPeriod = FIVE_MINUTES, // 3 days
      distributionPeriod = FIVE_MINUTES, // 14 days
    } = options;

    // Extract numeric pincodes from proposal
    const pincodes =
      proposal.campaign?.pincodes
        ?.map((p) => {
          const numeric = parseInt(p, 10);
          return Number.isFinite(numeric) ? numeric : null;
        })
        .filter((p) => p !== null) ?? [];

    // Build CampaignDetails struct
    const details = {
      campaignId: 0n, // Campaign ID is set by the factory
      title: proposal.campaignTitle,
      descriptionURI: proposal.campaignMetadataUri,
      pincodes: pincodes.map((p) => BigInt(p)),
      state: 0, // Initial state (enum ICampaign.CampaignState)
    };

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    executionDataRef.current = {
      onChainProposalId: proposal.onChainProposalId,
      donationPeriod,
      registrationPeriod,
      waitingPeriod,
      distributionPeriod,
    };

    try {
      await writeContract({
        address: DAO_GOVERNANCE_CONTRACT_ADDRESS,
        abi: DaoGovernanceABI,
        functionName: "extecuteProposal",
        args: [
          BigInt(proposal.onChainProposalId),
          details,
          BigInt(donationPeriod),
          BigInt(registrationPeriod),
          BigInt(waitingPeriod),
          BigInt(distributionPeriod),
        ],
      });
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to initiate campaign creation transaction",
      );
      setError(normalized);
      toast.error(normalized);
      setIsSubmitting(false);
      executionDataRef.current = null;
      throw err;
    }
  };

  useEffect(() => {
    if (isConfirmed && hash && executionDataRef.current) {
      let campaignAddressFromChain = null;

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

          if (decoded?.eventName === "ProposalExecuted") {
            campaignAddressFromChain =
              decoded.args?.campaignAddress?.toString?.() ?? null;
            break;
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (!campaignAddressFromChain) {
        toast.error(
          "Couldn't read the campaign address from chain. Campaign creation may have failed.",
        );
        setIsSubmitting(false);
        executionDataRef.current = null;
        return;
      }

      verifyAndSaveCampaign(
        hash,
        executionDataRef.current.onChainProposalId,
        campaignAddressFromChain,
      )
        .then(() => {
          setIsSubmitting(false);
          executionDataRef.current = null;
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
      executionDataRef.current = null;
    }
  }, [isConfirmed, hash, receipt, receiptError, contractError]);

  return {
    createCampaign,
    hash,
    isPending: isPendingTransaction || isSubmitting,
    isConfirming,
    isConfirmed,
    isVerifying,
    successMessage,
    error,
  };
};
