const DaoTabs = ({ activeTab, onTabChange, membersCount }) => {
  const tabs = [
    { key: "proposals", label: "Proposals" },
    { key: "members", label: `DAO Members (${membersCount})` },
  ];

  return (
    <div className="mt-8 w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-1">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              activeTab === tab.key
                ? "bg-orange-500 text-white"
                : "text-slate-300 hover:text-orange-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DaoTabs;
