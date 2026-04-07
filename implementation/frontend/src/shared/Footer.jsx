import { product } from "./siteConfig";

const Footer = ({ demoUrl }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950/90">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-slate-800 pb-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h3 className="text-base font-semibold text-orange-300">{product.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Modern DeFi infrastructure for transparent and accountable public
              finance operations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-300 sm:flex sm:flex-wrap sm:justify-end sm:gap-5">
            <a className="transition hover:text-orange-300" href="/#top">
              Back to top
            </a>
            <a className="transition hover:text-orange-300" href="/#overview">
              Overview
            </a>
            <a className="transition hover:text-orange-300" href="/whitepaper">
              White Paper
            </a>
            <a
              className="transition hover:text-orange-300"
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Product Walkthrough
            </a>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{year} Ministry-Ready Infrastructure.</p>
          <p>Built for India • Security-first • Audit-ready</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
