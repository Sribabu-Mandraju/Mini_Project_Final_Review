import { Link } from "react-router-dom";
import {
  FiAward,
  FiBarChart2,
  FiClock,
  FiCpu,
  FiHeart,
  FiLayers,
  FiShield,
  FiTarget,
  FiZap,
} from "react-icons/fi";

import { product } from "../../shared/siteConfig";

const benefitCards = [
  "A smart wallet that requires no gas fees.",
  "Specific disaster events and see exactly where their funds go.",
  "Every transaction is recorded on-chain for complete accountability.",
  "Donors receive a custom NFT badge recognizing their contribution.",
];

const valuesCards = [
  {
    title: "Transparency",
    description: "We believe in complete openness in all our operations.",
    icon: "target",
  },
  {
    title: "Speed",
    description: "Quick response when every minute counts.",
    icon: "clock",
  },
  {
    title: "Compassion",
    description: "Empathy drives every decision we make.",
    icon: "heart",
  },
  {
    title: "Innovation",
    description: "Using technology to maximize impact.",
    icon: "lightbulb",
  },
];

const howItWorksCards = [
  {
    title: "Easy Onboarding",
    description:
      "Victims can onboard easily using a smart wallet that requires no gas fees.",
    icon: "shield",
  },
  {
    title: "Transparent Donations",
    description:
      "Donors can contribute to specific disaster events and see exactly where their funds go.",
    icon: "bolt",
  },
  {
    title: "Complete Traceability",
    description:
      "Every donation is traceable, and every transaction is recorded on-chain for complete accountability.",
    icon: "chart",
  },
  {
    title: "NFT Recognition",
    description:
      "As a small token of appreciation, donors receive a custom NFT badge recognizing their contribution.",
    icon: "ribbon",
  },
];

const workflowSteps = [
  {
    step: "Step 1",
    title: "Proposal",
    description:
      "Community members propose targeted relief initiatives, leveraging blockchain to ensure transparent aid delivery.",
  },
  {
    step: "Step 2",
    title: "DAO Voting",
    description: "Community votes on the proposal.",
  },
  {
    step: "Step 3",
    title: "Event Contract Deployment",
    description:
      "Deploy the event contract and move funds from main escrow to event escrow.",
  },
  {
    step: "Step 4 (Active Period)",
    title: "Accepting Donations & Victim Registration",
    description: "Accept donations and register victims using (Address & PIN).",
  },
];

const techCards = [
  {
    title: "Base",
    subtitle: "Blockchain Network",
    description:
      "Powering secure, transparent transactions for disaster relief",
    icon: "blockchain",
  },
  
];

const Icon = ({ name }) => {
  const cls = "h-12 w-12";
  const iconByName = {
    shield: FiShield,
    bolt: FiZap,
    chart: FiBarChart2,
    ribbon: FiAward,
    target: FiTarget,
    clock: FiClock,
    heart: FiHeart,
    lightbulb: FiCpu,
    blockchain: FiLayers,
    ai: FiCpu,
  };
  const IconComponent = iconByName[name];
  if (IconComponent) return <IconComponent className={cls} />;
  return null;
};

const About = () => {
  return (
    <main className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
      {/* Hero - About */}
      <section className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
          About{" "}
          <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            {product.name}
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
          Revolutionizing disaster relief through blockchain technology,
          ensuring every donation reaches those who need it most.
        </p>
      </section>

      {/* Benefit cards */}
      <section className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefitCards.map((text) => (
          <article
            key={text}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-center"
          >
            <p className="text-sm text-slate-300">{text}</p>
          </article>
        ))}
      </section>

      {/* Our Mission */}
      <section className="mx-auto mt-16 max-w-5xl">
        <p className="mb-4 inline-flex rounded-full border border-orange-400/60 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200">
          Our Mission
        </p>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-12">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-orange-400/40 bg-slate-950/60">
              <span className="text-center text-xs font-bold uppercase tracking-wider text-orange-400/80">
                Disaster Relief
              </span>
            </div>
            <p className="mt-6 text-xl font-bold text-white">
              Building a Better Tomorrow
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white lg:text-3xl">
              Empowering Communities Through Technology
            </h2>
            <p className="mt-4 text-slate-300">
              At {product.name}, we believe that technology can bridge the gap
              between generosity and impact. Our mission is to create a world
              where aid reaches those in need swiftly and transparently, powered
              by blockchain technology.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: "shield",
                  text: "Every transaction is recorded and traceable.",
                },
                {
                  icon: "bolt",
                  text: "Aid reaches beneficiaries without delays.",
                },
                {
                  icon: "blockchain",
                  text: "Supporting communities worldwide.",
                },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-400/60 text-orange-400 [&>svg]:h-6 [&>svg]:w-6">
                    <Icon name={item.icon} />
                  </span>
                  <span className="text-slate-300">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="mx-auto mt-20 max-w-5xl text-center">
        <h2 className="text-3xl font-bold text-white">Our Values</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          The principles that guide our mission and shape our impact.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valuesCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-400/60 text-orange-400">
                <Icon name={card.icon} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto mt-20 max-w-5xl text-center">
        <h2 className="text-3xl font-bold text-white">How It Works</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          Our innovative approach to disaster relief combines blockchain
          technology with humanitarian aid.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-400/60 text-orange-400">
                <Icon name={card.icon} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-3xl font-bold text-white">Work flow</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-slate-300">
          From inception to impact, follow our path of innovation and growth.
        </p>
        <div className="relative mt-12">
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-orange-400/40" />
          {workflowSteps.map((item, idx) => (
            <div
              key={item.title}
              className={`relative flex gap-8 pb-12 last:pb-0 ${
                idx % 2 === 0 ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex-1" />
              <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                <span className="h-4 w-4 rounded-full bg-orange-400" />
              </div>
              <div
                className={`flex-1 ${
                  idx % 2 === 0 ? "text-right" : "text-left"
                }`}
              >
                <span className="inline-block rounded-lg border border-orange-400/60 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-200">
                  {item.step}
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Technologies */}
      <section className="mx-auto mt-20 max-w-5xl text-center">
        <h2 className="text-3xl font-bold text-white">Our Technologies</h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          Through the power of blockchain technology and community support,
          we&apos;ve made a real difference in people&apos;s lives.
        </p>
        <div className="mt-10 flex items-center justify-center">
          {techCards.map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-400/60 text-orange-400">
                <Icon name={card.icon} />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-white">
                {card.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-orange-400">
                {card.subtitle}
              </p>
              <p className="mt-3 text-slate-300">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Join Our Mission */}
      <section className="mx-auto mt-20 max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-white">Join Our Mission</h2>
        <p className="mx-auto mt-4 text-slate-300">
          Together, we can make a real difference in the lives of those affected
          by disasters. Join our community of changemakers today.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/donations"
            className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 px-8 py-4 text-base font-semibold text-white transition hover:from-orange-500 hover:to-amber-300"
          >
            Get Involved
          </Link>
          <Link
            to="/campaigns"
            className="rounded-xl border border-orange-400/70 bg-slate-950/70 px-8 py-4 text-base font-semibold text-orange-200 transition hover:border-orange-300 hover:text-white"
          >
            Learn More
          </Link>
        </div>
      </section>
    </main>
  );
};

export default About;
