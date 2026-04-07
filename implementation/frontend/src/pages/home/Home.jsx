import { Link } from "react-router-dom";
import About from "../about/About";

const Home = () => {
  return (
    <div id="top" className="text-slate-100">
      <main id="overview" className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 px-8 py-12 md:px-12 md:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(251,146,60,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,146,60,0.08)_1px,transparent_1px)] bg-[size:62px_62px]" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent" />

          <div className="relative max-w-3xl">
            <p className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-300">
              <span className="mr-2 h-2.5 w-2.5 rounded-full bg-orange-400" />
              Live Campaign
            </p>

            <h1 className="mt-8 text-4xl font-extrabold leading-tight text-slate-100 md:text-6xl">
              Together, We Can
              <span className="block text-orange-300">Rebuild Lives</span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
              Join our global movement to provide immediate relief and long-term
              recovery support to people affected by natural disasters. Every
              contribution makes a difference.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/donations"
                className="rounded-full bg-orange-500 px-7 py-3 text-base font-semibold text-white transition hover:bg-orange-400"
              >
                Donate Now
              </Link>
              <Link
                to="/campaigns"
                className="rounded-full border border-slate-700 bg-slate-900/80 px-7 py-3 text-base font-semibold text-slate-200 transition hover:border-orange-400 hover:text-orange-300"
              >
                Learn More
              </Link>
            </div>

            <div className="mt-10 grid max-w-4xl grid-cols-1 gap-6 border-t border-slate-800 pt-7 text-center sm:grid-cols-3 sm:text-left">
              <div>
                <p className="text-4xl font-bold text-orange-300">50M+</p>
                <p className="mt-1 text-sm text-slate-400">People Helped</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-orange-300">120+</p>
                <p className="mt-1 text-sm text-slate-400">Countries</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-orange-300">98%</p>
                <p className="mt-1 text-sm text-slate-400">Funds Utilized</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <article className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition hover:border-orange-500/40 hover:bg-slate-900 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-orange-300">
                  STEP 1
                </p>
                <h2 className="mt-4 text-3xl font-bold text-slate-100">
                  Discover Verified Campaigns
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-300">
                  Browse active campaigns with transparent goals, timelines, and
                  wallet details. Every listing is structured so donors can make
                  informed and trusted decisions quickly.
                </p>
                <Link
                  to="/campaigns"
                  className="mt-6 inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-orange-400 hover:text-orange-300"
                >
                  Browse Campaigns
                </Link>
              </div>
              <div className="hidden h-20 w-20 rounded-full border border-orange-500/30 bg-orange-500/10 text-2xl font-bold text-orange-300 lg:grid lg:place-items-center">
                01
              </div>
            </div>
          </article>

          <article className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition hover:border-orange-500/40 hover:bg-slate-900 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-orange-300">
                  STEP 2
                </p>
                <h2 className="mt-4 text-3xl font-bold text-slate-100">
                  Select and Donate Securely
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-300">
                  Choose a campaign, set your donation amount, and confirm in
                  your wallet. Transactions are direct and auditable, keeping
                  the donation process clear for every contributor.
                </p>
                <Link
                  to="/donations"
                  className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400"
                >
                  Donate Now
                </Link>
              </div>
              <div className="hidden h-20 w-20 rounded-full border border-orange-500/30 bg-orange-500/10 text-2xl font-bold text-orange-300 lg:grid lg:place-items-center">
                02
              </div>
            </div>
          </article>

          <article className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition hover:border-orange-500/40 hover:bg-slate-900 md:p-10">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-3xl">
                <p className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-orange-300">
                  STEP 3
                </p>
                <h2 className="mt-4 text-3xl font-bold text-slate-100">
                  Receive NFT Badge
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-300">
                  After a successful donation, you receive a unique NFT badge as
                  verifiable proof of impact and long-term contribution to the
                  campaign ecosystem.
                </p>
                <Link
                  to="/dao"
                  className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400"
                >
                  Explore DAO
                </Link>
              </div>
              <div className="hidden h-20 w-20 rounded-full border border-orange-500/30 bg-orange-500/10 text-2xl font-bold text-orange-300 lg:grid lg:place-items-center">
                03
              </div>
            </div>
          </article>
        </section>
      </main>

      {/* About / How it works sections reused as part of the landing page */}
      <About />
    </div>
  );
};

export default Home;
