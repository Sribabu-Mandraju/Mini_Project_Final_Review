import { useState, useEffect, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";

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
 * Custom hook to remove a DAO member with smart contract interaction
 * and backend verification (sets isDaoMember=false)
 */
export const useRemoveDaoMember = () => {
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const memberAddressRef = useRef(null);

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
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Verify transaction on blockchain and update member in backend
   */
  const verifyAndRemoveInBackend = async (transactionHash, memberAddress) => {
    setIsVerifying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/dao-members/remove/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionHash,
            daoMemberAddress: memberAddress,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Backend verification failed");
      }

      const message =
        data?.message || "DAO member marked as removed successfully";
      setSuccessMessage(message);
      toast.success(message);

      return data;
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to verify removal with backend",
      );
      setError(normalized);
      toast.error(normalized);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Remove DAO member from smart contract
   * @param {string} memberAddress - Ethereum address of the member to remove
   */
  const removeDaoMember = async (memberAddress) => {
    if (!memberAddress || typeof memberAddress !== "string") {
      const err = new Error("Valid member address is required");
      setError(err.message);
      throw err;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(memberAddress)) {
      const err = new Error("Invalid Ethereum address format");
      setError(err.message);
      throw err;
    }

    setIsSubmitting(true);
    setError(null);
    memberAddressRef.current = memberAddress;

    try {
      writeContract({
        address: DAO_GOVERNANCE_CONTRACT_ADDRESS,
        abi: DaoGovernanceABI,
        functionName: "removeDAOMember",
        args: [memberAddress],
      });
    } catch (err) {
      const normalized = normalizeErrorMessage(
        err.message || "Failed to initiate removal transaction",
      );
      setError(normalized);
      toast.error(normalized);
      setIsSubmitting(false);
      memberAddressRef.current = null;
      throw err;
    }
  };

  // Handle transaction confirmation and backend verification
  useEffect(() => {
    if (isConfirmed && hash && memberAddressRef.current) {
      verifyAndRemoveInBackend(hash, memberAddressRef.current)
        .then(() => {
          setIsSubmitting(false);
          memberAddressRef.current = null;
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
      memberAddressRef.current = null;
    }
  }, [isConfirmed, hash, receiptError, contractError]);

  return {
    removeDaoMember,
    hash,
    isPending: isPendingTransaction || isSubmitting,
    isConfirming,
    isConfirmed,
    isVerifying,
    successMessage,
    error,
  };
};
