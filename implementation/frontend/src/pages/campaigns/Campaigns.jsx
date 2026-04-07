import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiRefreshCw, FiExternalLink } from "react-icons/fi";
import { BACKEND_API_URL } from "../../shared/contractConfig";
import { formatMoney } from "../../components/newProposal/helpers";
import { fetchIpfsMetadata } from "../../utils/ipfs";

const filterOptions = [
  "All",
  "Active",
  "Registration",
  "Waiting",
  "Distribution",
  "Closed",
];

const shortenAddress = (address) => {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const Campaigns = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [campaigns, setCampaigns] = useState([]);
  const [campaignMetadata, setCampaignMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_API_URL}/campaigns`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Failed to load campaigns");
      }

      const apiCampaigns = json.data?.campaigns ?? [];
      setCampaigns(apiCampaigns);

      // Fetch IPFS metadata for each campaign
      const metadataPromises = apiCampaigns.map(async (campaign) => {
        try {
          if (campaign.descriptionURI) {
            const metadata = await fetchIpfsMetadata(campaign.descriptionURI);
            return { campaignId: campaign._id, metadata };
          }
          // Fallback to proposal campaign data
          return {
            campaignId: campaign._id,
            metadata: {
              description: campaign.proposalId?.campaign?.description || "",
              image: campaign.proposalId?.campaign?.imageUrl || "",
            },
          };
        } catch (error) {
          console.error(
            `Failed to load IPFS metadata for campaign ${campaign._id}:`,
            error,
          );
          // Return fallback data
          return {
            campaignId: campaign._id,
            metadata: {
              description: campaign.proposalId?.campaign?.description || "",
              image: campaign.proposalId?.campaign?.imageUrl || "",
            },
          };
        }
      });

      const metadataResults = await Promise.all(metadataPromises);
      const metadataMap = {};
      metadataResults.forEach(({ campaignId, metadata }) => {
        metadataMap[campaignId] = metadata;
      });
      setCampaignMetadata(metadataMap);
    } catch (err) {
      setError(err.message || "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    if (activeFilter === "All") return campaigns;
    // For now, we'll filter by a simple status check
    // You can enhance this based on campaign state from smart contract
    return campaigns;
  }, [campaigns, activeFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateDescription = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const getCampaignImage = (campaign) => {
    const metadata = campaignMetadata[campaign._id];
    return metadata?.image || campaign.proposalId?.campaign?.imageUrl || "";
  };

  const getCampaignDescription = (campaign) => {
    const metadata = campaignMetadata[campaign._id];
    return (
      metadata?.description || campaign.proposalId?.campaign?.description || ""
    );
  };

  return (
    <main className="starfield relative mx-auto min-h-screen max-w-7xl px-6 pb-20 pt-8 lg:px-8">
      <section className="flex flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-orange-400/60 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-200 transition hover:border-orange-400/80 hover:text-orange-100"
          >
            <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            Live Campaigns
          </button>
          <button
            type="button"
            onClick={loadCampaigns}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-orange-400/50 hover:text-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <h1 className="mt-8 text-4xl font-bold leading-tight text-white md:text-5xl">
          Support Our{" "}
          <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            Relief Campaigns
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
          Your donations help us provide critical aid to those in need. Join our
          global community of donors making a real difference.
        </p>

        <div className="mt-8 flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setActiveFilter(opt)}
              className={`min-w-[90px] rounded-xl px-5 py-3 text-sm font-semibold transition ${
                activeFilter === opt
                  ? "bg-orange-500 text-white"
                  : "border border-slate-700 bg-slate-950/60 text-slate-300 hover:border-orange-400/50 hover:text-orange-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto mt-12 max-w-6xl">
        <h2 className="text-2xl font-bold text-white">
          {activeFilter === "All"
            ? "All Campaigns"
            : `${activeFilter} Campaigns`}
        </h2>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-200">
            {error}
          </div>
        ) : isLoading && campaigns.length === 0 ? (
          <div className="mt-6 min-h-[200px] rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-400">
            Loading campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="mt-6 min-h-[200px] rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-400">
            No campaigns found.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => {
              const campaignImage = getCampaignImage(campaign);
              const campaignDescription = getCampaignDescription(campaign);
              const truncatedDescription = truncateDescription(
                campaignDescription,
              );

              return (
                <Link
                  key={campaign._id}
                  to={`/campaigns/${campaign._id}`}
                  className="group flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition hover:border-orange-400/50 hover:bg-slate-900/80"
                >
                  {/* Campaign Image */}
                  {campaignImage && (
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={campaignImage}
                        alt={campaign.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-orange-200">
                          {campaign.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Created {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                      <FiExternalLink className="ml-2 h-5 w-5 flex-shrink-0 text-slate-500 group-hover:text-orange-400" />
                    </div>

                    {/* Description */}
                    {truncatedDescription && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-300">
                        {truncatedDescription}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Funds Allocated</span>
                        <span className="font-semibold text-green-400">
                          {formatMoney(campaign.fundsAllocated)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Campaign Address</span>
                        <span className="font-mono text-xs text-slate-300">
                          {shortenAddress(campaign.campaignAddress)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                        Donation: {Math.floor(campaign.donationPeriod / 86400)}d
                      </span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                        Registration:{" "}
                        {Math.floor(campaign.registrationPeriod / 86400)}d
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Campaigns;
