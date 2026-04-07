import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";

import { FiArrowLeft } from "react-icons/fi";
import { defaultCenter } from "../../components/newProposal/constants";
import { BACKEND_API_URL } from "../../shared/contractConfig";
import { useProposalVote } from "../../hooks/useProposalVote";
import { useCreateCampaign } from "../../hooks/useCreateCampaign";
import { fetchIpfsMetadata } from "../../utils/ipfs";
import toast from "react-hot-toast";
import ProposalHero from "../../components/proposeDetails/ProposalHero";
import ProposalAbout from "../../components/proposeDetails/ProposalAbout";
import ProposalDescription from "../../components/proposeDetails/ProposalDescription";
import ProposalAffectedArea from "../../components/proposeDetails/ProposalAffectedArea";
import ProposalEligibility from "../../components/proposeDetails/ProposalEligibility";
import ProposalVotingSidebar from "../../components/proposeDetails/ProposalVotingSidebar";

const ProposalDetails = () => {
  const { proposalId } = useParams();
  const { address } = useAccount();
  const [proposal, setProposal] = useState(null);
  const [ipfsData, setIpfsData] = useState(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIpfs, setIsLoadingIpfs] = useState(false);
  const [error, setError] = useState(null);

  // Use onChainProposalId for voting and keep local counts in sync
  const {
    voteYes,
    voteNo,
    isPending: isVotingPending,
    isConfirming: isVotingConfirming,
    isConfirmed: isVoteConfirmed,
  } = useProposalVote(proposal?.onChainProposalId, {
    onVotePersisted: (updated) => {
      setProposal((prev) =>
        prev
          ? {
              ...prev,
              forVotes: updated.forVotes,
              againstVotes: updated.againstVotes,
              state: updated.state,
            }
          : prev,
      );
    },
  });

  const {
    createCampaign,
    isPending: isExecutingPending,
    isConfirming: isExecutingConfirming,
    isVerifying: isExecutingVerifying,
  } = useCreateCampaign();

  // Load proposal data
  useEffect(() => {
    const loadProposal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${BACKEND_API_URL}/proposals/${proposalId}`,
        );
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || "Failed to load proposal details");
        }

        const proposalData = json.data?.proposal ?? null;
        setProposal(proposalData);

        // Fetch IPFS metadata if available
        if (proposalData?.campaignMetadataUri) {
          setIsLoadingIpfs(true);
          try {
            const metadata = await fetchIpfsMetadata(
              proposalData.campaignMetadataUri,
            );
            setIpfsData(metadata);
          } catch (ipfsError) {
            console.error("Failed to load IPFS metadata:", ipfsError);
            // Fallback to campaign data if IPFS fails
            setIpfsData({
              description:
                proposalData.campaign?.description ||
                "No description available.",
              image: proposalData.campaign?.imageUrl || "",
            });
          } finally {
            setIsLoadingIpfs(false);
          }
        } else {
          // Use fallback data
          setIpfsData({
            description:
              proposalData?.campaign?.description ||
              "No description available.",
            image: proposalData?.campaign?.imageUrl || "",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load proposal details");
      } finally {
        setIsLoading(false);
      }
    };

    loadProposal();
  }, [proposalId]);

  // Load total DAO members for voting requirements
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch(
          `${BACKEND_API_URL}/dao-members?isDaoMember=true`,
        );
        const json = await response.json();
        if (json.success && json.data?.members) {
          setTotalMembers(json.data.members.length);
        }
      } catch (err) {
        console.error("Failed to load DAO members:", err);
      }
    };
    loadMembers();
  }, []);

  const isBusy =
    isVotingPending ||
    isVotingConfirming ||
    isExecutingPending ||
    isExecutingConfirming ||
    isExecutingVerifying;

  const handleExecute = async () => {
    if (!proposal) return;
    try {
      await createCampaign(proposal);
      // Reload proposal after successful campaign creation to get updated state
      const response = await fetch(
        `${BACKEND_API_URL}/proposals/${proposalId}`,
      );
      const json = await response.json();
      if (json.success && json.data?.proposal) {
        setProposal(json.data.proposal);
      }
    } catch {
      // errors surfaced via toast
    }
  };

  const handleVote = async (support) => {
    if (!proposal?.onChainProposalId) {
      toast.error("This proposal isn’t synced on-chain yet.");
      return;
    }
    try {
      if (support) {
        await voteYes();
      } else {
        await voteNo();
      }
    } catch {
      // errors surfaced via toast
    }
  };

  const center =
    proposal &&
    proposal.campaign &&
    Number.isFinite(proposal.campaign.latitude) &&
    Number.isFinite(proposal.campaign.longitude)
      ? [proposal.campaign.latitude, proposal.campaign.longitude]
      : defaultCenter;

  // Calculate voting stats
  const forVotes = proposal?.forVotes || 0;
  const againstVotes = proposal?.againstVotes || 0;
  const totalVotes = forVotes + againstVotes;
  const requiredVotesPercentage = 60; // 60% threshold
  const requiredVotes = Math.ceil(
    (totalMembers * requiredVotesPercentage) / 100,
  );
  const approvalPercentage =
    totalMembers > 0 ? ((forVotes / totalMembers) * 100).toFixed(1) : 0;
  const isPassed = forVotes >= requiredVotes;

  // Get image URL (prioritize IPFS, fallback to campaign.imageUrl)
  const heroImageUrl = ipfsData?.image || proposal?.campaign?.imageUrl || "";

  // Get description (prioritize IPFS, fallback to campaign.description)
  const description =
    ipfsData?.description ||
    proposal?.campaign?.description ||
    "No description available.";

  // Format date
  const proposalDate = proposal?.createdAt
    ? new Date(proposal.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  // Calculate voting end date (assuming 7 days from creation)
  const votingEndDate = proposal?.endTime
    ? new Date(proposal.endTime * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : proposal?.createdAt
    ? new Date(
        new Date(proposal.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", {
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

  return (
    <div className="starfield min-h-screen bg-slate-950 text-slate-100">
      <main className="relative mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link
          to="/dao"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-orange-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to DAO
        </Link>

        {isLoading ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
            Loading proposal details...
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-200">
            {error}
          </div>
        ) : !proposal ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
            Proposal not found.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <ProposalHero proposal={proposal} heroImageUrl={heroImageUrl} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              {/* Left Column - Main Content */}
              <div className="space-y-6">
                <ProposalAbout
                  proposal={proposal}
                  proposalDate={proposalDate}
                  votingEndDate={votingEndDate}
                  formatAddress={formatAddress}
                />
                <ProposalDescription description={description} />
                <ProposalAffectedArea proposal={proposal} center={center} />
                <ProposalEligibility />
              </div>

              {/* Right Column - Voting Sidebar */}
              <ProposalVotingSidebar
                address={address}
                formatAddress={formatAddress}
                totalMembers={totalMembers}
                requiredVotes={requiredVotes}
                requiredVotesPercentage={requiredVotesPercentage}
                forVotes={forVotes}
                againstVotes={againstVotes}
                approvalPercentage={approvalPercentage}
                isPassed={isPassed}
                isBusy={isBusy}
                canVote={Boolean(proposal?.onChainProposalId)}
                onVote={handleVote}
                onExecute={handleExecute}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProposalDetails;
