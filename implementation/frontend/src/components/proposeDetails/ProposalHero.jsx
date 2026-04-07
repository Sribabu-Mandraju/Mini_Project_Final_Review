import { FiClock } from "react-icons/fi";

const ProposalHero = ({ proposal, heroImageUrl }) => {
  if (!proposal || !heroImageUrl) return null;

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-800 sm:h-80">
      <img
        src={heroImageUrl}
        alt={proposal.campaignTitle}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FiClock className="h-4 w-4" />
            <span>Proposal #{proposal.onChainProposalId || proposal.id}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {proposal.campaignTitle}
          </h1>
          {proposal.campaign?.latitude && proposal.campaign?.longitude && (
            <p className="mt-2 text-sm text-slate-300">
              {proposal.campaign.latitude.toFixed(7)},{" "}
              {proposal.campaign.longitude.toFixed(7)}
              {proposal.campaign?.radius && (
                <span> (Radius: {proposal.campaign.radius} km)</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalHero;
