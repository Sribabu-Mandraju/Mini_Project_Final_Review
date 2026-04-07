import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";

import CampaignABI from "../abis/campaign.json";

const isAddress = (addr) =>
  typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);

/**
 * Read victim-related info from a Campaign contract:
 * - totalVictims()
 * - victims(currentWallet)
 */
export const useCampaignVictimStatus = (campaignAddress) => {
  const { address } = useAccount();
  const validCampaign = isAddress(campaignAddress);

  const { data: totalVictimsRaw, isLoading: loadingVictims } = useReadContract({
    address: validCampaign ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "totalVictims",
  });

  const { data: isVictimRaw, isLoading: loadingIsVictim } = useReadContract({
    address: validCampaign && address ? campaignAddress : undefined,
    abi: CampaignABI,
    functionName: "victims",
    args: address ? [address] : undefined,
  });

  const totalVictims =
    totalVictimsRaw != null ? Number(totalVictimsRaw) || 0 : null;
  const isVictim = Boolean(isVictimRaw);

  const isLoading = useMemo(() => loadingVictims || loadingIsVictim, [
    loadingVictims,
    loadingIsVictim,
  ]);

  return {
    totalVictims,
    isVictim,
    address,
    isLoading,
  };
};
