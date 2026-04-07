import { FiMapPin } from "react-icons/fi";

const CampaignHero = ({ campaign, heroImageUrl }) => {
  if (!campaign || !heroImageUrl) return null;

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-800 sm:h-80">
      <img
        src={heroImageUrl}
        alt={campaign.title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FiMapPin className="h-4 w-4" />
            <span>
              Campaign Address: {campaign.campaignAddress?.slice(0, 10)}...
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {campaign.title}
          </h1>
          {campaign.proposalId?.campaign?.latitude &&
            campaign.proposalId?.campaign?.longitude && (
              <p className="mt-2 text-sm text-slate-300">
                {campaign.proposalId.campaign.latitude.toFixed(7)},{" "}
                {campaign.proposalId.campaign.longitude.toFixed(7)}
                {campaign.proposalId.campaign?.radius && (
                  <span>
                    {" "}
                    (Radius: {campaign.proposalId.campaign.radius} km)
                  </span>
                )}
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default CampaignHero;
