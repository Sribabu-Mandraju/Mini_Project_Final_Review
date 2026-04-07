/**
 * Maps long contract/wallet error messages to short, user-friendly messages.
 * Used so the frontend never shows verbose viem/contract errors to the user.
 */
const ERROR_MAP = [
  {
    match: (msg) =>
      /exceeds maximum per-transaction gas limit|gas limit|transaction gas/i.test(
        msg,
      ),
    shortMessage:
      "Transaction limit exceeded. Try a smaller amount or try again later.",
    errorCode: "GAS_LIMIT_EXCEEDED",
  },
  {
    match: (msg) =>
      /user denied|user rejected|rejected the request/i.test(msg),
    shortMessage: "Transaction was cancelled.",
    errorCode: "USER_REJECTED",
  },
  {
    match: (msg) => /insufficient funds|insufficient balance/i.test(msg),
    shortMessage: "Insufficient USDC balance. Please check your wallet.",
    errorCode: "INSUFFICIENT_FUNDS",
  },
  {
    match: (msg) => /allowance|approve|allowance exceeded/i.test(msg),
    shortMessage:
      "Token approval needed. Please approve USDC spending and try again.",
    errorCode: "APPROVAL_REQUIRED",
  },
  {
    match: (msg) => /network|chain mismatch|wrong network/i.test(msg),
    shortMessage: "Wrong network. Please switch to the correct chain.",
    errorCode: "WRONG_NETWORK",
  },
];

/**
 * Get a short user-facing message and error code from a long error message.
 * @param {string} rawMessage - Full error message from contract/wallet
 * @returns {{ shortMessage: string, errorCode: string }}
 */
export function getShortDonationError(rawMessage) {
  const msg = String(rawMessage || "").trim();
  for (const { match, shortMessage, errorCode } of ERROR_MAP) {
    if (match(msg)) {
      return { shortMessage, errorCode };
    }
  }
  return {
    shortMessage: "Donation failed. Please try again.",
    errorCode: "UNKNOWN_ERROR",
  };
}
