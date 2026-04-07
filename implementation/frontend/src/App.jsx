import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Campaigns from "./pages/campaigns/Campaigns";
import CampaignDetails from "./pages/campaignDetails/CampaignDetails";
import Dao from "./pages/dao/Dao";
import NewProposal from "./pages/newProposal/NewProposal";
import ProposalDetails from "./pages/proposalDetails/ProposalDetails";
import Donations from "./pages/donations/Donations";
import Home from "./pages/home/Home";
import IpfsPage from "./pages/ipfs/ipfs";
import WhitePaper from "./pages/whitepaper/WhitePaper";
import Footer from "./shared/Footer";
import Navbar from "./shared/Navbar";
import { demoUrl, navItems } from "./shared/siteConfig";

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#020617",
            color: "#e5e7eb",
            border: "1px solid #1f2937",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#020617",
            },
          },
          error: {
            iconTheme: {
              primary: "#f97316",
              secondary: "#020617",
            },
          },
        }}
      />
      <Navbar navItems={navItems} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:campaignId" element={<CampaignDetails />} />
          <Route path="/dao" element={<Dao />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/dao/new-proposal" element={<NewProposal />} />
          <Route
            path="/dao/proposals/:proposalId"
            element={<ProposalDetails />}
          />
          <Route path="/ipfs" element={<IpfsPage />} />
          <Route path="/whitepaper" element={<WhitePaper />} />
        </Routes>
      </main>
      <Footer demoUrl={demoUrl} />
    </div>
  </BrowserRouter>
);

export default App;
