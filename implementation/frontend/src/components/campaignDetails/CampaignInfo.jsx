import { FiClock, FiDollarSign, FiCalendar, FiMapPin } from "react-icons/fi";
import { formatMoney } from "../../components/newProposal/helpers";
import { useCampaignDonate } from "../../hooks/useCampaignDonate";
import { useCampaignVictimStatus } from "../../hooks/useCampaignVictimStatus";
import Spinner from "../../shared/Spinner";

const CampaignInfo = ({ campaign, formatAddress, periodDates }) => {
  if (!campaign) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);

  // Read total on-chain donations for this campaign and add them on top
  // of the initially allocated amount coming from the backend.
  const { totalFunds } = useCampaignDonate(
    campaign.campaignAddress || undefined,
  );
  const onChainDonations = Number.isFinite(totalFunds) ? totalFunds : 0;
  const alreadyDistributed = Number(campaign.fundsDistributed ?? 0);
  const remainingAllocated = Math.max(
    0,
    Number(campaign.fundsAllocated ?? 0) - alreadyDistributed,
  );
  const combinedAvailable = remainingAllocated + onChainDonations;

  const {
    totalVictims,
    isVictim,
    address,
    isLoading: victimsLoading,
  } = useCampaignVictimStatus(campaign.campaignAddress);

  const formatPeriodDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPeriodDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0 sec";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const parts = [];
    if (mins > 0) {
      parts.push(`${mins} min${mins !== 1 ? "s" : ""}`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs} sec${secs !== 1 ? "s" : ""}`);
    }
    return parts.join(" ");
  };

  const formatRemaining = (endTimestamp) => {
    if (!endTimestamp) return "—";
    const delta = endTimestamp - nowSeconds;
    if (delta <= 0) return "Ended";
    const mins = Math.floor(delta / 60);
    const secs = delta % 60;
    const mm = String(mins).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");
    return `${mm}:${ss} remaining`;
  };

  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Campaign Details</h2>

        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <FiDollarSign className="mt-0.5 h-5 w-5 text-orange-400" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Available Funds
              </div>
              <div className="mt-1 text-lg font-bold text-green-400">
                {formatMoney(combinedAvailable)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                From allocation:{" "}
                <span className="text-slate-200">
                  {formatMoney(remainingAllocated)}
                </span>{" "}
                · From direct donations:{" "}
                <span className="text-slate-200">
                  {formatMoney(onChainDonations)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiMapPin className="mt-0.5 h-5 w-5 text-orange-400" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Campaign Address
              </div>
              <div className="mt-1 font-mono text-sm text-slate-200">
                {formatAddress(campaign.campaignAddress)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiClock className="mt-0.5 h-5 w-5 text-orange-400" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Victim Status
              </div>
              <div className="mt-1 text-sm text-slate-100">
                {victimsLoading ? (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <Spinner className="h-3.5 w-3.5 border-slate-400" />
                    Checking victim status…
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2">
                      {address ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isVictim
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {isVictim ? "You are registered" : "Not registered"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Connect your wallet to see your status.
                        </span>
                      )}
                    </span>
                    {totalVictims != null && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Registered victims:{" "}
                        <span className="font-semibold text-slate-200">
                          {totalVictims}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white">
          Campaign Timeline
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Donation Period</span>
              <span className="font-semibold text-slate-100">
                {formatPeriodDuration(campaign.donationPeriod)}
              </span>
            </div>
            {periodDates?.donationEnd && (
              <div className="mt-1 text-xs text-slate-400">
                Ends: {formatPeriodDate(periodDates.donationEnd)}
              </div>
            )}
            {periodDates?.donationEnd && (
              <div className="mt-0.5 text-[11px] text-slate-500">
                {formatRemaining(periodDates.donationEnd)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Registration Period</span>
              <span className="font-semibold text-slate-100">
                {formatPeriodDuration(campaign.registrationPeriod)}
              </span>
            </div>
            {periodDates?.registrationEnd && (
              <div className="mt-1 text-xs text-slate-400">
                Ends: {formatPeriodDate(periodDates.registrationEnd)}
              </div>
            )}
            {periodDates?.registrationEnd && (
              <div className="mt-0.5 text-[11px] text-slate-500">
                {formatRemaining(periodDates.registrationEnd)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Waiting Period</span>
              <span className="font-semibold text-slate-100">
                {formatPeriodDuration(campaign.waitingPeriod)}
              </span>
            </div>
            {periodDates?.waitingEnd && (
              <div className="mt-1 text-xs text-slate-400">
                Ends: {formatPeriodDate(periodDates.waitingEnd)}
              </div>
            )}
            {periodDates?.waitingEnd && (
              <div className="mt-0.5 text-[11px] text-slate-500">
                {formatRemaining(periodDates.waitingEnd)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Distribution Period</span>
              <span className="font-semibold text-slate-100">
                {formatPeriodDuration(campaign.distributionPeriod)}
              </span>
            </div>
            {periodDates?.distributionEnd && (
              <div className="mt-1 text-xs text-slate-400">
                Ends: {formatPeriodDate(periodDates.distributionEnd)}
              </div>
            )}
            {periodDates?.distributionEnd && (
              <div className="mt-0.5 text-[11px] text-slate-500">
                {formatRemaining(periodDates.distributionEnd)}
              </div>
            )}
          </div>
        </div>
      </div>

      {campaign.pincodes && campaign.pincodes.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white">
            Eligible Pincodes
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {campaign.pincodes.slice(0, 10).map((pincode, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300"
              >
                {pincode}
              </span>
            ))}
            {campaign.pincodes.length > 10 && (
              <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400">
                +{campaign.pincodes.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default CampaignInfo;
