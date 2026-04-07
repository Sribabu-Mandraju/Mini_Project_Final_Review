import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import {
  FiArrowLeft,
  FiHeart,
  FiUserCheck,
  FiGift,
  FiArrowRight,
  FiX,
} from "react-icons/fi";
import Spinner from "../../shared/Spinner";
import { defaultCenter } from "../../components/newProposal/constants";
import { BACKEND_API_URL } from "../../shared/contractConfig";
import { fetchIpfsMetadata } from "../../utils/ipfs";
import CampaignHero from "../../components/campaignDetails/CampaignHero";
import CampaignAbout from "../../components/campaignDetails/CampaignAbout";
import CampaignDescription from "../../components/campaignDetails/CampaignDescription";
import CampaignAffectedArea from "../../components/campaignDetails/CampaignAffectedArea";
import CampaignInfo from "../../components/campaignDetails/CampaignInfo";
import { useClaimFund } from "../../hooks/useClaimFund";
import VictimRegistrationModal from "../../components/campaignDetails/VictimRegistrationModal";

const CampaignDetails = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [ipfsData, setIpfsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIpfs, setIsLoadingIpfs] = useState(false);
  const [error, setError] = useState(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${BACKEND_API_URL}/campaigns/${campaignId}`,
        );
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to load campaign details");
        }

        const campaignData = json.data?.campaign ?? null;
        setCampaign(campaignData);

        // Fetch IPFS metadata if available
        if (campaignData?.descriptionURI) {
          setIsLoadingIpfs(true);
          try {
            const metadata = await fetchIpfsMetadata(
              campaignData.descriptionURI,
            );
            setIpfsData(metadata);
          } catch (ipfsError) {
            console.error("Failed to load IPFS metadata:", ipfsError);
            // Fallback to proposal campaign data if IPFS fails
            setIpfsData({
              description:
                campaignData.proposalId?.campaign?.description ||
                "No description available.",
              image: campaignData.proposalId?.campaign?.imageUrl || "",
            });
          } finally {
            setIsLoadingIpfs(false);
          }
        } else {
          // Use fallback data
          setIpfsData({
            description:
              campaignData?.proposalId?.campaign?.description ||
              "No description available.",
            image: campaignData?.proposalId?.campaign?.imageUrl || "",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load campaign details");
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const center =
    campaign &&
    campaign.proposalId?.campaign &&
    Number.isFinite(campaign.proposalId.campaign.latitude) &&
    Number.isFinite(campaign.proposalId.campaign.longitude)
      ? [
          campaign.proposalId.campaign.latitude,
          campaign.proposalId.campaign.longitude,
        ]
      : defaultCenter;

  // Get image URL (prioritize IPFS, fallback to campaign.imageUrl)
  const heroImageUrl =
    ipfsData?.image || campaign?.proposalId?.campaign?.imageUrl || "";

  // Get description (prioritize IPFS, fallback to campaign.description)
  const description =
    ipfsData?.description ||
    campaign?.proposalId?.campaign?.description ||
    "No description available.";

  // Format date
  const campaignDate = campaign?.createdAt
    ? new Date(campaign.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Calculate period dates
  const calculatePeriodDates = () => {
    if (!campaign?.createdAt) return null;

    const startTime = Math.floor(new Date(campaign.createdAt).getTime() / 1000);
    const donationEnd = startTime + campaign.donationPeriod;
    const registrationEnd = donationEnd + campaign.registrationPeriod;
    const waitingEnd = registrationEnd + campaign.waitingPeriod;
    const distributionEnd = waitingEnd + campaign.distributionPeriod;

    return {
      donationEnd,
      registrationEnd,
      waitingEnd,
      distributionEnd,
    };
  };

  const periodDates = calculatePeriodDates();

  const {
    claim,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    statusMessage: claimStatusMessage,
    error: claimError,
  } = useClaimFund(campaign?.campaignAddress);

  const handleClaimFunds = () => {
    claim();
  };

  return (
    <div className="starfield min-h-screen bg-slate-950 text-slate-100">
      <main className="relative mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-orange-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        {isLoading ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
            Loading campaign details...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-200">
            {error}
          </div>
        ) : !campaign ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
            Campaign not found.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <CampaignHero campaign={campaign} heroImageUrl={heroImageUrl} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              {/* Left Column - Main Content */}
              <div className="space-y-6">
                <CampaignAbout
                  campaign={campaign}
                  campaignDate={campaignDate}
                  formatAddress={formatAddress}
                />
                <CampaignDescription description={description} />
                <CampaignAffectedArea campaign={campaign} center={center} />
              </div>

              {/* Right Column - Campaign Info Sidebar + Actions */}
              <div className="flex flex-col gap-6">
                <CampaignInfo
                  campaign={campaign}
                  formatAddress={formatAddress}
                  periodDates={periodDates}
                />

                {/* Campaign Actions (UI only, no on-chain logic here) */}
                <section className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-4 sm:p-5">
                  <header className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Take Action
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-white">
                      Support or Request Help
                    </h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Pick one of the options below; details will be confirmed
                      in the actual flow.
                    </p>
                  </header>

                  <div className="space-y-3">
                    {/* Donate */}
                    <button
                      type="button"
                      onClick={() => setIsDonateOpen(true)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:from-orange-500 hover:to-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 shrink-0">
                          <FiHeart className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            Donate to this Campaign
                          </span>
                          <span className="block text-[11px] text-amber-100/90">
                            Contribute funds to increase available relief.
                          </span>
                        </span>
                      </span>
                      <FiArrowRight className="h-4 w-4 shrink-0 opacity-80" />
                    </button>

                    {/* Register as Victim */}
                    <button
                      type="button"
                      onClick={() => setIsRegisterOpen(true)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2.5 text-left text-sm text-slate-100 transition hover:border-violet-400/70 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 shrink-0">
                          <FiUserCheck className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            Register as Victim
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            If you&apos;re affected, start the process here.
                          </span>
                        </span>
                      </span>
                      <FiArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>

                    {/* Claim Funds */}
                    <button
                      type="button"
                      onClick={handleClaimFunds}
                      disabled={isClaimPending || isClaimConfirming}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2.5 text-left text-sm text-slate-100 transition hover:border-emerald-400/70 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 shrink-0">
                          <FiGift className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            Claim Relief Funds
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {claimStatusMessage ||
                              "Once eligible, use this option to receive help."}
                          </span>
                        </span>
                      </span>
                      {(isClaimPending || isClaimConfirming) && (
                        <Spinner className="h-3.5 w-3.5 border-emerald-300" />
                      )}
                      <FiArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>

                    {claimError && (
                      <p className="text-[11px] text-red-400 leading-snug">
                        {claimError}
                      </p>
                    )}

                    <p className="pt-1 text-[10px] leading-relaxed text-slate-500">
                      Note: These buttons are visual only in this screen. Actual
                      wallet connection and eligibility checks will happen in
                      the next steps.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Donate to Campaign Modal */}
      {campaign && isDonateOpen && (
        <DonateModal
          campaign={campaign}
          amount={donationAmount}
          setAmount={setDonationAmount}
          onClose={() => setIsDonateOpen(false)}
        />
      )}

      {/* Register as Victim Modal */}
      {campaign && isRegisterOpen && (
        <VictimRegistrationModal
          campaignAddress={campaign.campaignAddress}
          campaignPincodes={campaign.pincodes}
          onClose={() => setIsRegisterOpen(false)}
        />
      )}
    </div>
  );
};

export default CampaignDetails;

// Lightweight donate modal specific to the campaign details page
import { useCampaignDonate } from "../../hooks/useCampaignDonate";
import { useAccount } from "wagmi";

const DonateModal = ({ campaign, amount, setAmount, onClose }) => {
  const { address } = useAccount();
  const {
    donate,
    minDonation,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    statusMessage,
  } = useCampaignDonate(campaign.campaignAddress);

  const isBusy = isPending || isConfirming;

  const handleSubmit = (e) => {
    e.preventDefault();
    donate(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-xl shadow-black/50">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Donate to Campaign
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white line-clamp-1">
              {campaign.title}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Amount (USDC)
            </label>
            <div className="mt-1.5 relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                $
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d.]/g, ""))
                }
                inputMode="decimal"
                placeholder="e.g. 10.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-7 pr-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/40"
              />
            </div>
            {minDonation != null && (
              <p className="mt-1 text-[11px] text-slate-500">
                Minimum donation: {minDonation} USDC
              </p>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-400 leading-snug">{error}</p>
          )}

          {!address && (
            <p className="text-[11px] text-slate-500">
              Connect your wallet to continue.
            </p>
          )}

          {isConfirmed && !error && (
            <p className="text-[11px] text-green-400">
              Donation confirmed on-chain and recorded. Thank you!
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !amount || Number(amount) <= 0 || !address}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:from-orange-500 hover:to-amber-300"
            >
              {isBusy ? statusMessage || "Processing…" : "Confirm Donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
