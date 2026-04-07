import { FiCheckCircle, FiThumbsDown, FiThumbsUp } from "react-icons/fi";

const ProposalVotingSidebar = ({
  address,
  formatAddress,
  totalMembers,
  requiredVotes,
  requiredVotesPercentage,
  forVotes,
  againstVotes,
  approvalPercentage,
  isPassed,
  isBusy,
  canVote = true,
  onVote,
  onExecute,
}) => (
  <aside className="space-y-4">
    <div className="sticky top-6 space-y-4">
      {/* Proposal Voting Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="text-lg font-semibold text-white">Proposal Voting</h2>
        {address && (
          <p className="mt-2 text-xs text-slate-400">
            Connected: {formatAddress(address)}
          </p>
        )}
      </div>

      {/* Voting Requirements */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Members:</span>
            <span className="font-semibold text-white">{totalMembers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Required Votes:</span>
            <span className="font-semibold text-white">
              {requiredVotes} ({requiredVotesPercentage}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">For Votes:</span>
            <span className="font-semibold text-emerald-400">{forVotes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Against Votes:</span>
            <span className="font-semibold text-rose-400">{againstVotes}</span>
          </div>
        </div>
      </div>

      {/* Approval Status */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {approvalPercentage}% Approval
          </span>
          <span className="text-xs text-slate-400">
            {requiredVotesPercentage}% Required
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${Math.min(approvalPercentage, 100)}%` }}
          />
        </div>
        <div className="mt-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              isPassed
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-300"
            }`}
          >
            {isPassed ? "Passed" : "Pending Finalization"}
          </span>
        </div>
      </div>

      {/* Voting Results */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-600/20 p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">
              {forVotes}
            </div>
            <div className="mt-1 text-xs font-semibold text-emerald-300">
              For
            </div>
          </div>
          <div className="rounded-xl bg-rose-600/20 p-4 text-center">
            <div className="text-3xl font-bold text-rose-400">
              {againstVotes}
            </div>
            <div className="mt-1 text-xs font-semibold text-rose-300">
              Against
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Required Votes: {requiredVotes} ({requiredVotesPercentage}%)
        </p>
      </div>

      {/* Voting Buttons */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onVote(true)}
            disabled={isBusy || !canVote}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiThumbsUp className="h-4 w-4" />
            Vote For
          </button>
          <button
            type="button"
            onClick={() => onVote(false)}
            disabled={isBusy || !canVote}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiThumbsDown className="h-4 w-4" />
            Vote Against
          </button>
        </div>
        {!canVote ? (
          <p className="mt-3 text-xs text-slate-400">
            Waiting for on-chain sync (missing proposal id).
          </p>
        ) : null}
      </div>

      {/* Recent Voters (static placeholder for now) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Voters</h3>
          <button
            type="button"
            className="text-xs text-orange-300 hover:text-orange-200"
          >
            View All
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">No voters yet</p>
      </div>

      {/* Execute Proposal (Operator Only) */}
      {address && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <button
            type="button"
            onClick={onExecute}
            disabled={isBusy || !isPassed}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/70 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCheckCircle className="h-4 w-4" />
            {isBusy ? "Processing..." : "Create Campaign"}
          </button>
        </div>
      )}
    </div>
  </aside>
);

export default ProposalVotingSidebar;
