import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  LogInWithAnonAadhaar,
  useAnonAadhaar,
  useProver,
} from "@anon-aadhaar/react";

import CampaignABI from "../abis/campaign.json";

const isAddress = (addr) =>
  typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);

/**
 * Converts an EVM address to the uint256 expected by Solidity's `addressToUint256`.
 * Example: 0xabc... -> BigInt(0xabc...)
 */
const addressToUint256 = (addr) => {
  if (!isAddress(addr)) return null;
  return BigInt(addr);
};

const toFixedLengthBigIntArray = (value, length) => {
  if (!Array.isArray(value) || value.length !== length) return null;
  try {
    return value.map((v) => BigInt(v));
  } catch {
    return null;
  }
};

/**
 * Anon Aadhaar / Groth16 proofs may come in different shapes depending on SDK version:
 * - Flattened array: uint256[8]
 * - Structured object: { a: [2], b: [[2],[2]], c: [2] }
 * Normalize to Solidity-friendly uint256[8]:
 * [a0, a1, b00, b01, b10, b11, c0, c1]
 */
const toGroth16ProofArray = (value) => {
  // Handle nested shapes (some SDKs wrap the proof)
  if (value && typeof value === "object") {
    const nested = value.groth16Proof || value.groth16_proof || value.proof;
    if (nested && nested !== value) {
      const nestedArr = toGroth16ProofArray(nested);
      if (nestedArr) return nestedArr;
    }
  }

  const alreadyFlat = toFixedLengthBigIntArray(value, 8);
  if (alreadyFlat) return alreadyFlat;

  if (!value || typeof value !== "object") return null;

  const a = value.a || value.pi_a || value.A;
  const b = value.b || value.pi_b || value.B;
  const c = value.c || value.pi_c || value.C;

  // snarkjs commonly returns pi_a/pi_c as [x, y, 1]
  // We only need the first 2 elements.
  const aRaw = Array.isArray(a) ? a.slice(0, 2) : a;
  const cRaw = Array.isArray(c) ? c.slice(0, 2) : c;
  const aArr = toFixedLengthBigIntArray(aRaw, 2);
  const cArr = toFixedLengthBigIntArray(cRaw, 2);

  // snarkjs commonly returns pi_b as [[x1, x2], [y1, y2], [1, 0]]
  // We only need the first 2 rows, and first 2 columns.
  const b0 = Array.isArray(b)
    ? Array.isArray(b[0])
      ? b[0].slice(0, 2)
      : b[0]
    : null;
  const b1 = Array.isArray(b)
    ? Array.isArray(b[1])
      ? b[1].slice(0, 2)
      : b[1]
    : null;
  const b0Arr = toFixedLengthBigIntArray(b0, 2);
  const b1Arr = toFixedLengthBigIntArray(b1, 2);

  if (!aArr || !b0Arr || !b1Arr || !cArr) return null;

  return [
    aArr[0],
    aArr[1],
    b0Arr[0],
    b0Arr[1],
    b1Arr[0],
    b1Arr[1],
    cArr[0],
    cArr[1],
  ];
};

const pickFirst = (...values) => {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return null;
};

const safeKeys = (obj) => {
  try {
    return obj && typeof obj === "object" ? Object.keys(obj) : [];
  } catch {
    return [];
  }
};

const normalizeErrorMessage = (message) => {
  if (!message) return "Something went wrong. Please try again.";

  const lower = String(message).toLowerCase();

  if (lower.includes("user denied") || lower.includes("user rejected")) {
    return "Transaction was cancelled.";
  }

  if (lower.includes("insufficient") && lower.includes("funds")) {
    return "Insufficient funds. Please check your balance.";
  }

  return "Unable to complete transaction. Please try again.";
};

const toBigIntOrNull = (value) => {
  if (value === undefined || value === null) return null;
  try {
    // Handle booleans, numbers, numeric strings
    if (typeof value === "boolean") return value ? 1n : 0n;
    if (typeof value === "number") return BigInt(Math.trunc(value));
    // Some SDK fields may be "1"/"0"
    return BigInt(value);
  } catch {
    return null;
  }
};

/**
 * Build Solidity verifier's revealArray[4] from common Anon Aadhaar fields.
 * NOTE: In the standard Anon Aadhaar circuits these are typically 0/1 flags
 * indicating whether a field was requested to be revealed. Here we keep the
 * numeric values as-is for compatibility with the existing verifier setup.
 */
const buildRevealArrayFromFields = (proof) => {
  const ageAbove18 = toBigIntOrNull(
    pickFirst(proof.ageAbove18, proof.revealAgeAbove18),
  );
  const gender = toBigIntOrNull(pickFirst(proof.gender, proof.revealGender));
  const pincode = toBigIntOrNull(pickFirst(proof.pincode, proof.revealPinCode));
  const state = toBigIntOrNull(pickFirst(proof.state, proof.revealState));

  // Ensure we always return exactly 4 values
  return [ageAbove18 ?? 0n, gender ?? 0n, pincode ?? 0n, state ?? 0n];
};

/**
 * Custom hook to:
 * - generate Anon Aadhaar proof (revealPinCode) with `signal=uint256(walletAddress)`
 * - call Campaign.registerAsVictim(...) using Campaign ABI
 *
 * Requirements enforced to match Solidity:
 * - `addressToUint256(msg.sender) == signal`
 * - `pincode = uint32(revealArray[2])` (we request `revealPinCode`)
 */
export function useRegisterAsVictim(campaignAddress, options = {}) {
  const { nullifierSeed: nullifierSeedOverride, allowedPincodes } = options;

  const { address } = useAccount();
  const [anonAadhaar] = useAnonAadhaar();
  const [, latestProof] = useProver();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const signal = useMemo(() => addressToUint256(address), [address]);

  const nullifierSeed = useMemo(() => {
    if (nullifierSeedOverride != null) {
      try {
        return BigInt(nullifierSeedOverride);
      } catch {
        return 1234n;
      }
    }
    const seedStr = import.meta.env.VITE_ANON_AADHAAR_NULLIFIER_SEED;
    if (!seedStr) return 1234n;
    try {
      return BigInt(seedStr);
    } catch {
      return 1234n;
    }
  }, [nullifierSeedOverride]);

  // Extract proof fields in a shape ready for wagmi args
  const proofPayload = useMemo(() => {
    // The SDK may return nested shapes like:
    // latestProof = { proof: { ... }, ... }
    // or latestProof = { proof: { proof: { ... } } }
    const p0 = latestProof?.proof || latestProof;
    const p1 = p0?.proof || p0; // handle double nesting
    const proof = p1;
    if (!proof) return null;

    const nullifierSeedValue = pickFirst(
      proof.nullifierSeed,
      proof.nullifier_seed,
    );
    const nullifierValue = pickFirst(proof.nullifier);
    const timestampValue = pickFirst(proof.timestamp);
    // Some SDK versions expose `signalHash` instead of the raw `signal`.
    // We must submit the raw `signal` to the Campaign contract, and it must equal uint256(walletAddress).
    // Since we also pass this same signal into <LogInWithAnonAadhaar signal="...">,
    // it's safe to default to our computed wallet-derived `signal` when `proof.signal` is absent.
    const signalValue = pickFirst(proof.signal, signal);

    const revealArrayValue = pickFirst(
      proof.revealArray,
      proof.reveal_array,
      proof.reveal,
      proof.reveals,
      proof.revealedData,
    );

    // Groth16 can be at different keys OR nested under `proof.proof`
    const groth16Value = pickFirst(
      proof.groth16Proof,
      proof.groth16_proof,
      proof.groth16,
      // some libs store groth16 under a generic `proof` key
      proof.snarkProof,
    );

    const revealArray =
      toFixedLengthBigIntArray(revealArrayValue, 4) ||
      // If SDK gives individual fields (like `pincode`) instead of revealArray, build it.
      buildRevealArrayFromFields(proof);
    const groth16Proof = toGroth16ProofArray(groth16Value);

    if (!revealArray || !groth16Proof) return null;

    // Extract pincode from proof for off-chain area validation
    const pincodeStr = proof.pincode ?? null;
    const pincodeNumeric = pincodeStr != null ? parseInt(pincodeStr, 10) : null;

    // Be tolerant: if any scalar is missing or non-numeric, fall back to 0n.
    return {
      nullifierSeed: toBigIntOrNull(nullifierSeedValue) ?? 0n,
      nullifier: toBigIntOrNull(nullifierValue) ?? 0n,
      timestamp: toBigIntOrNull(timestampValue) ?? 0n,
      signal: toBigIntOrNull(signalValue) ?? 0n,
      revealArray,
      groth16Proof,
      pincode: Number.isFinite(pincodeNumeric) ? pincodeNumeric : null,
    };
  }, [latestProof, signal]);

  const proofDebug = useMemo(() => {
    const p0 = latestProof?.proof || latestProof;
    const p1 = p0?.proof || p0;
    const proof = p1;
    const groth16 =
      proof?.groth16Proof ?? proof?.groth16_proof ?? proof?.groth16 ?? null;
    const groth16Shape = (() => {
      if (!groth16) return "missing";
      if (Array.isArray(groth16)) return `array(len=${groth16.length})`;
      if (typeof groth16 === "object") {
        const k = safeKeys(groth16);
        return `object(keys=${k.slice(0, 8).join(", ") || "—"})`;
      }
      return typeof groth16;
    })();
    return {
      topKeys: safeKeys(latestProof).slice(0, 12),
      proofKeys: safeKeys(p0).slice(0, 12),
      innerProofKeys: safeKeys(proof).slice(0, 12),
      hasLatestProof: Boolean(latestProof),
      groth16Shape,
    };
  }, [latestProof]);

  const isValidCampaign = isAddress(campaignAddress);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const canSubmit =
    Boolean(address) &&
    Boolean(signal != null) &&
    isValidCampaign &&
    anonAadhaar?.status === "logged-in" &&
    Boolean(proofPayload) &&
    !isPending &&
    !isConfirming;

  const disabledReason = useMemo(() => {
    if (!address) return "Connect your wallet.";
    if (signal == null) return "Couldn’t compute signal from wallet address.";
    if (!isValidCampaign) return "Invalid campaign contract address.";
    if (anonAadhaar?.status !== "logged-in")
      return "Generate an Anon Aadhaar proof first (status must be logged-in).";
    if (!proofPayload)
      return "Proof not ready yet (or could not be parsed). Generate the proof again.";
    if (isPending || isConfirming) return "Transaction in progress…";
    return null;
  }, [
    address,
    signal,
    isValidCampaign,
    anonAadhaar?.status,
    proofPayload,
    isPending,
    isConfirming,
  ]);

  const register = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!address) {
      const msg = "Connect your wallet first.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!signal) {
      const msg = "Couldn’t compute signal from wallet address.";
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
    if (anonAadhaar?.status !== "logged-in" || !proofPayload) {
      const msg = "Generate a valid Anon Aadhaar proof first.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Validate pincode from Aadhaar proof against campaign's affected area
    if (
      Array.isArray(allowedPincodes) &&
      allowedPincodes.length > 0 &&
      proofPayload.pincode != null
    ) {
      const allowedNumeric = allowedPincodes
        .map((p) => parseInt(p, 10))
        .filter((v) => Number.isFinite(v));

      const isAllowed = allowedNumeric.includes(proofPayload.pincode);

      if (!isAllowed) {
        const msg =
          "Your Aadhaar pincode is not in the affected area for this campaign.";
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    // Enforce Solidity constraint: addressToUint256(msg.sender) == signal
    if (proofPayload.signal !== signal) {
      const msg =
        "Proof signal doesn’t match your connected wallet. Regenerate the proof.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Debug: log payload being sent to the contract so you can inspect it in devtools
    // Remove or guard with an env flag for production if desired.
    // eslint-disable-next-line no-console
    console.log("[registerAsVictim] payload", {
      campaignAddress,
      nullifierSeed: proofPayload.nullifierSeed.toString(),
      nullifier: proofPayload.nullifier.toString(),
      timestamp: proofPayload.timestamp.toString(),
      signal: proofPayload.signal.toString(),
      revealArray: proofPayload.revealArray.map((v) => v.toString()),
      groth16Proof: proofPayload.groth16Proof.map((v) => v.toString()),
    });

    setHasSubmitted(true);
    toast.success("Submitting registration transaction…");

    try {
      writeContract({
        address: campaignAddress,
        abi: CampaignABI,
        functionName: "registerAsVictim",
        args: [
          proofPayload.nullifierSeed,
          proofPayload.nullifier,
          proofPayload.timestamp,
          proofPayload.signal,
          proofPayload.revealArray,
          proofPayload.groth16Proof,
        ],
      });
    } catch (e) {
      const msg = normalizeErrorMessage(e?.message);
      setError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    const raw = receiptError?.message || writeError?.message;
    if (raw) {
      const msg = normalizeErrorMessage(raw);
      setError(msg);
      toast.error(msg);
    }
  }, [receiptError, writeError]);

  useEffect(() => {
    if (isConfirmed && hasSubmitted) {
      const msg = "Victim registration confirmed on-chain.";
      setSuccessMessage(msg);
      toast.success(msg);
    }
  }, [isConfirmed, hasSubmitted]);

  const loginProps = useMemo(() => {
    // Props to pass directly to <LogInWithAnonAadhaar />
    return {
      nullifierSeed: nullifierSeed.toString(),
      signal: signal != null ? signal.toString() : undefined,
      fieldsToReveal: ["revealPinCode"],
    };
  }, [nullifierSeed, signal]);

  return {
    walletAddress: address,
    campaignAddress,
    isValidCampaign,
    // anon aadhaar
    anonAadhaarStatus: anonAadhaar?.status,
    latestProof,
    proofPayload,
    hasProofPayload: Boolean(proofPayload),
    proofDebug,
    loginProps,
    LogInWithAnonAadhaar,

    // contract tx
    register,
    canSubmit,
    disabledReason,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    hasSubmitted,

    // state
    signal,
    error,
    successMessage,
  };
}
