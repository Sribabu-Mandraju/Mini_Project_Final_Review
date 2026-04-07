import { FiX, FiShield, FiCheckCircle } from "react-icons/fi";
import Spinner from "../../shared/Spinner";
import { useRegisterAsVictim } from "../../hooks/useRegisterAsVictim";

/**
 * Victim registration modal:
 * - Generates Anon Aadhaar proof revealing pincode
 * - Calls Campaign.registerAsVictim(nullifierSeed, nullifier, timestamp, signal, revealArray, groth16Proof)
 */
export default function VictimRegistrationModal({
  campaignAddress,
  campaignPincodes,
  onClose,
}) {
  const {
    walletAddress,
    isValidCampaign,
    anonAadhaarStatus,
    LogInWithAnonAadhaar,
    loginProps,
    register,
    canSubmit,
    disabledReason,
    hasProofPayload,
    proofDebug,
    isPending,
    isConfirming,
    isConfirmed,
    hasSubmitted,
    signal,
    error,
  } = useRegisterAsVictim(campaignAddress, {
    allowedPincodes: campaignPincodes,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-xl shadow-black/50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Register as Victim
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white">
              Verify with Anon Aadhaar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-start gap-2">
              <FiShield className="mt-0.5 h-4 w-4 text-violet-300" />
              <div>
                <p className="text-xs font-medium text-slate-200">
                  Privacy-preserving verification
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                  You’ll generate a proof that reveals only your pincode. Your
                  wallet address is used as the proof signal (as required by the
                  contract).
                </p>
              </div>
            </div>
          </div>

          {!walletAddress && (
            <p className="text-[11px] text-slate-500">
              Connect your wallet to continue.
            </p>
          )}

          {walletAddress && signal != null && (
            <p className="text-[11px] text-slate-500">
              Signal (uint256 of wallet):{" "}
              <span className="text-slate-300">{signal.toString()}</span>
            </p>
          )}

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Step 1 — Generate Proof
            </p>
            <div className="mt-2">
              <LogInWithAnonAadhaar
                nullifierSeed={loginProps.nullifierSeed}
                signal={loginProps.signal}
                fieldsToReveal={loginProps.fieldsToReveal}
              />
              <p className="mt-2 text-[11px] text-slate-500">
                Status:{" "}
                <span className="text-slate-300">{anonAadhaarStatus}</span>
              </p>
              {anonAadhaarStatus === "logged-in" && (
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-300">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  Proof ready (if your pincode is valid for this campaign, you
                  can submit).
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Step 2 — Submit Registration
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-slate-400">
              <p>
                - Wallet:{" "}
                <span
                  className={
                    walletAddress ? "text-emerald-300" : "text-red-300"
                  }
                >
                  {walletAddress ? "connected" : "not connected"}
                </span>
              </p>
              <p>
                - Campaign address:{" "}
                <span
                  className={
                    isValidCampaign ? "text-emerald-300" : "text-red-300"
                  }
                >
                  {isValidCampaign ? "valid" : "invalid"}
                </span>
              </p>
              <p>
                - Anon Aadhaar status:{" "}
                <span
                  className={
                    anonAadhaarStatus === "logged-in"
                      ? "text-emerald-300"
                      : "text-slate-300"
                  }
                >
                  {anonAadhaarStatus || "unknown"}
                </span>
              </p>
              <p>
                - Proof parsed:{" "}
                <span
                  className={
                    hasProofPayload ? "text-emerald-300" : "text-red-300"
                  }
                >
                  {hasProofPayload ? "yes" : "no"}
                </span>
              </p>
            </div>
            {!hasProofPayload && anonAadhaarStatus === "logged-in" && (
              <details className="mt-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-400">
                <summary className="cursor-pointer select-none text-slate-300">
                  Debug (proof keys)
                </summary>
                <div className="mt-2 space-y-1">
                  <p>topKeys: {proofDebug?.topKeys?.join(", ") || "—"}</p>
                  <p>proofKeys: {proofDebug?.proofKeys?.join(", ") || "—"}</p>
                  <p>
                    innerProofKeys:{" "}
                    {proofDebug?.innerProofKeys?.join(", ") || "—"}
                  </p>
                  <p>groth16Shape: {proofDebug?.groth16Shape || "—"}</p>
                </div>
              </details>
            )}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={register}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:from-violet-500 hover:to-fuchsia-400"
              >
                {(isPending || isConfirming) && (
                  <Spinner className="h-3.5 w-3.5 border-white/80" />
                )}
                {isPending || isConfirming ? "Submitting…" : "Register"}
              </button>
            </div>
            {!canSubmit && disabledReason && (
              <p className="mt-2 text-[11px] text-slate-400">
                {disabledReason}
              </p>
            )}
            {isConfirmed && hasSubmitted && !error && (
              <p className="mt-2 text-[11px] text-emerald-300">
                Registered successfully (on-chain).
              </p>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-300 leading-snug">{error}</p>
          )}

          <p className="text-[10px] leading-relaxed text-slate-500">
            Based on Anon Aadhaar quick setup:{" "}
            <a
              className="text-orange-300 hover:text-orange-200 underline underline-offset-2"
              href="https://documentation.anon-aadhaar.pse.dev/docs/quick-setup"
              target="_blank"
              rel="noreferrer"
            >
              docs/quick-setup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
