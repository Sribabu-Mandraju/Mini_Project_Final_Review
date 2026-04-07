import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiRefreshCw } from "react-icons/fi";

import { BACKEND_API_URL } from "../../shared/contractConfig";
import { formatMoney } from "../newProposal/helpers";

const shortenAddress = (address) => {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ProposalsSection = ({ statusFilter, onStatusFilterChange }) => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProposals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_API_URL}/proposals`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to load proposals");
      }

      const apiProposals = json.data?.proposals ?? [];

      setProposals(
        apiProposals.map((proposal, index) => ({
          id: proposal.id || index + 1,
          title: proposal.campaignTitle,
          area:
            proposal.campaign?.locationDisplayName ||
            proposal.campaign?.addressLine ||
            "Multiple locations",
          proposer: proposal.proposerAddress,
          fundsRequested: proposal.fundsRequested,
          createdAt: proposal.createdAt,
          status: proposal.state || "Active",
          votesSummary: `${proposal.forVotes ?? 0} / ${proposal.againstVotes ?? 0}`,
        })),
      );
    } catch (err) {
      setError(err.message || "Failed to load proposals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const filteredProposals = useMemo(() => {
    if (statusFilter === "All States") return proposals;
    return proposals.filter((proposal) => proposal.status === statusFilter);
  }, [proposals, statusFilter]);

  const hasProposals = filteredProposals.length > 0;

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Proposals</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live ideas from DAO members. Spin one up or just lurk and vote.
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 outline-none focus:border-orange-400/70 sm:w-auto"
          >
            <option value="All States">All States</option>
            <option value="Active">Active</option>
            <option value="Passed">Passed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadProposals}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-orange-400/50 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            to="/dao/new-proposal"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-orange-500 hover:to-amber-300"
          >
            <FiPlus className="h-4 w-4" />
            New Proposal
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  ID
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Disaster
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Area
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Proposer
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Funds Requested
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Votes
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !hasProposals ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Grabbing proposals from the chain & database...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              ) : !hasProposals ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No proposals yet. Be the first to launch a relief campaign.
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="border-b border-slate-800/70 hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-3 text-sm text-slate-300">
                      #{proposal.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-100">
                      {proposal.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {proposal.area}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {shortenAddress(proposal.proposer)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-100">
                      {formatMoney(proposal.fundsRequested)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          proposal.status === "Active"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : proposal.status === "Passed"
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                            : "border-red-500/40 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {proposal.votesSummary}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dao/proposals/${encodeURIComponent(proposal.id)}`,
                          )
                        }
                        className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-orange-400/60 hover:text-orange-200"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ProposalsSection;
