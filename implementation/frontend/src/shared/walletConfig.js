import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  "ca703cec4e1cc82b7e8a1342fed93c90";

const baseSepoliaRpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "SampadaChain",
  projectId,
  chains: [baseSepolia],
  transports: {
    // Prefer explicit RPC URL; fall back to default public RPC if not set
    [baseSepolia.id]: baseSepoliaRpcUrl ? http(baseSepoliaRpcUrl) : http(),
  },
  ssr: false,
});

export const supportedChains = [baseSepolia];
