import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Verify if a transaction exists on the blockchain
 * @param {string} transactionHash - The transaction hash to verify (0x...)
 * @returns {Promise<boolean>} True if transaction exists and is successful, false otherwise
 */
export const verifyTransaction = async (transactionHash) => {
  try {
    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      console.error("Invalid transaction hash format:", transactionHash);
      return false;
    }

    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;

    // Create a public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      // Prefer explicit RPC URL; fall back to default public RPC if not set
      transport: rpcUrl ? http(rpcUrl) : http(),
    });

    // Try to get the transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash,
    });

    // If receipt exists and status is success, transaction is valid
    return receipt && receipt.status === "success";
  } catch (error) {
    console.error("Error verifying transaction:", error.message);
    // If transaction doesn't exist, viem will throw an error
    return false;
  }
};
