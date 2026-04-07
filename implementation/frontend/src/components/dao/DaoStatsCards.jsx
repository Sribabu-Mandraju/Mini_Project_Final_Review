import {
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiUsers,
} from "react-icons/fi";

const statCards = [
  { label: "Total Members", value: "2", icon: "members" },
  { label: "Total Proposals", value: "4", icon: "proposals" },
  { label: "Treasury Balance", value: "$5.00 USDC", icon: "treasury" },
  { label: "Total Passed Funds", value: "$5.000000000000 USDC", icon: "funds" },
];

const StatIcon = ({ icon }) => {
  const iconClassName = "h-8 w-8";

  if (icon === "members") {
    return <FiUsers className={iconClassName} />;
  }

  if (icon === "proposals") {
    return <FiCheckCircle className={iconClassName} />;
  }

  if (icon === "treasury") {
    return <FiDollarSign className={iconClassName} />;
  }

  return <FiFileText className={iconClassName} />;
};

const DaoStatsCards = () => {
  return (
    <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card) => (
        <article
          key={card.label}
          className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg shadow-slate-900/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-orange-400">
            <StatIcon icon={card.icon} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-1 truncate text-base font-bold text-white sm:text-lg">
              {card.value}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default DaoStatsCards;
