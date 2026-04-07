import { FiCalendar, FiDollarSign, FiUser, FiClock } from "react-icons/fi";
import { formatMoney } from "../../components/newProposal/helpers";

const ProposalAbout = ({
  proposal,
  proposalDate,
  votingEndDate,
  formatAddress,
}) => {
  if (!proposal) return null;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          About This Proposal
        </h2>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          Elaborate
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Disaster Relief Proposal
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiDollarSign className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Funds Requested:</span>
            <span className="text-white">
              {formatMoney(proposal.fundsRequested)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiCalendar className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Proposal Date:</span>
            <span>{proposalDate}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiUser className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Proposer:</span>
            <span className="font-mono text-xs">
              {formatAddress(proposal.proposerAddress)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiClock className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">Voting Ends:</span>
            <span>{votingEndDate}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProposalAbout;
