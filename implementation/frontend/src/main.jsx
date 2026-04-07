import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnonAadhaarProvider } from "@anon-aadhaar/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";

import App from "./App.jsx";
import "./index.css";
import { supportedChains, wagmiConfig } from "./shared/walletConfig";

const queryClient = new QueryClient();

const useTestAadhaar = false;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AnonAadhaarProvider _useTestAadhaar={useTestAadhaar}>
          <RainbowKitProvider
            chains={supportedChains}
            theme={darkTheme({
              accentColor: "#f97316",
              accentColorForeground: "#ffffff",
              borderRadius: "medium",
            })}
          >
            <App />
          </RainbowKitProvider>
        </AnonAadhaarProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
