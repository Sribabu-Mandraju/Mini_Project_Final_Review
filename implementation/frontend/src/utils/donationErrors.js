/**
 * Maps long contract/wallet error messages to short, user-friendly messages.
 * Kept in sync with backend src/utils/donationErrors.js so users never see verbose errors.
 */
const ERROR_MAP = [
  {
    match: (msg) =>
      /exceeds maximum per-transaction gas limit|gas limit|transaction gas/i.test(
        msg,
      ),
    shortMessage:
      "Transaction limit exceeded. Try a smaller amount or try again later.",
  },
  {
    match: (msg) =>
      /user denied|user rejected|rejected the request/i.test(msg),
    shortMessage: "Transaction was cancelled.",
  },
  {
    match: (msg) => /insufficient funds|insufficient balance/i.test(msg),
    shortMessage: "Insufficient USDC balance. Please check your wallet.",
  },
  {
    match: (msg) => /allowance|approve|allowance exceeded/i.test(msg),
    shortMessage:
      "Token approval needed. Please approve USDC spending and try again.",
  },
  {
    match: (msg) => /network|chain mismatch|wrong network/i.test(msg),
    shortMessage: "Wrong network. Please switch to the correct chain.",
  },
];

/**
 * @param {string} rawMessage
 * @returns {string} Short user-facing message
 */
export function getShortDonationError(rawMessage) {
  const msg = String(rawMessage || "").trim();
  for (const { match, shortMessage } of ERROR_MAP) {
    if (match(msg)) return shortMessage;
  }
  return "Donation failed. Please try again.";
}
