import { FiCalendar, FiDollarSign, FiMapPin } from "react-icons/fi";
import { formatMoney } from "../../components/newProposal/helpers";

const CampaignAbout = ({ campaign, campaignDate, formatAddress }) => {
  if (!campaign) return null;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          About This Campaign
        </h2>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Active Relief Campaign
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiDollarSign className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Funds Allocated:</span>
            <span className="text-green-400 font-semibold">
              {formatMoney(campaign.fundsAllocated)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiCalendar className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Campaign Started:</span>
            <span>{campaignDate}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiMapPin className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Campaign Address:</span>
            <span className="font-mono text-xs">
              {formatAddress(campaign.campaignAddress)}
            </span>
          </div>
          {campaign.proposalId && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="font-semibold">From Proposal:</span>
              <span className="text-xs">
                {campaign.proposalId.campaignTitle || "N/A"}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default CampaignAbout;
