import DaoTabs from "./DaoTabs";

const DaoHeader = ({ activeTab, onTabChange, membersCount }) => {
  const isMembersTab = activeTab === "members";

  return (
    <section className="flex flex-col items-center text-center">
      <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/60 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
        <span className="h-2 w-2 rounded-full bg-orange-400" />
        DAO Governance
      </p>

      <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
        Disaster Relief{" "}
        <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
          {isMembersTab ? "Admin Panel" : "Proposals"}
        </span>
      </h1>

      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
        {isMembersTab
          ? "Manage DAO members and escrow contract settings with clear admin controls."
          : "Vote on active proposals or create new ones to help communities in need. Your participation shapes our collective response to disasters worldwide."}
      </p>

      <DaoTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        membersCount={membersCount}
      />
    </section>
  );
};

export default DaoHeader;
