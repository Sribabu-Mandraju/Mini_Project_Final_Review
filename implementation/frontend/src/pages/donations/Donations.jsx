import { useState, useEffect } from "react";
import {
  FiArrowRight,
  FiDollarSign,
  FiGlobe,
  FiHeart,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import Spinner from "../../shared/Spinner";
import { useEscrowDonate } from "../../hooks/useEscrowDonate";

const featureCards = [
  {
    title: "Transparent",
    description: "Every donation is tracked on the blockchain",
    icon: <FiShield className="h-12 w-12" />,
  },
  {
    title: "Global Impact",
    description: "Support communities worldwide",
    icon: <FiGlobe className="h-12 w-12" />,
    highlight: true,
  },
  {
    title: "Community",
    description: "Join a network of donors making a difference",
    icon: <FiUsers className="h-12 w-12" />,
  },
];

const Donations = () => {
  const [amount, setAmount] = useState("");
  const {
    donate,
    balance,
    minDonation,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  } = useEscrowDonate();

  const isBusy = isPending || isConfirming;
  const handleDonate = () => donate(amount);

  useEffect(() => {
    if (isConfirmed) setAmount("");
  }, [isConfirmed]);

  return (
    <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
      <section className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-400/60 text-orange-400">
          <FiHeart className="h-8 w-8" />
        </div>

        <h1 className="mt-8 text-4xl font-bold leading-tight text-white md:text-5xl">
          Make a{" "}
          <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            Difference
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
          Your donation helps us provide immediate relief and long-term support
          to communities affected by disasters.
        </p>
      </section>

      <section className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className={`rounded-xl border p-6 text-center ${
              card.highlight
                ? "border-orange-400/60 bg-slate-950/80"
                : "border-slate-800 bg-slate-950/60"
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-400/60 text-orange-400">
              {card.icon}
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-xl">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Current Escrow Balance
            </h2>
            <FiDollarSign className="h-6 w-6 text-orange-400" />
          </div>
          <p className="mt-4 text-3xl font-bold text-orange-400">
            {balance != null ? `$${balance}` : "—"}
          </p>
        </div>

        <div className="mt-8">
          <label className="block text-sm font-semibold text-slate-200">
            Donation Amount (USDC)
          </label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g., 10.00"
              inputMode="decimal"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/30"
            />
            {minDonation != null && Number(minDonation) > 0 && (
              <p className="mt-1.5 text-xs text-slate-400">
                Minimum donation: ${minDonation} USDC
              </p>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          disabled={isBusy || !amount || Number(amount) <= 0}
          onClick={handleDonate}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 py-4 text-base font-semibold text-white transition hover:from-orange-500 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            {isBusy && <Spinner className="h-4 w-4 border-white/70" />}
            {isBusy ? "Confirming…" : "Donate Now"}
            <FiArrowRight className="h-5 w-5" />
          </span>
        </button>
      </section>
    </main>
  );
};

export default Donations;
