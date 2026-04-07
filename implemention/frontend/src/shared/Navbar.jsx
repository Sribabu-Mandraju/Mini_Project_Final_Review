import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FiGift, FiGlobe, FiHeart, FiHome, FiInfo } from "react-icons/fi";
import { Link, NavLink, useLocation } from "react-router-dom";

import { product } from "./siteConfig";

const baseNavItemClass =
  "rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-orange-500/10 hover:text-orange-200";
const activeNavItemClass = "bg-orange-500/15 text-orange-300";
const mobileNavItemClass =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-orange-300";

const NavItemIcon = ({ icon }) => {
  const className = "h-4 w-4";

  if (icon === "home") {
    return <FiHome aria-hidden="true" className={className} />;
  }

  if (icon === "campaigns") {
    return <FiHeart aria-hidden="true" className={className} />;
  }

  if (icon === "dao") {
    return <FiGlobe aria-hidden="true" className={className} />;
  }

  if (icon === "about") {
    return <FiInfo aria-hidden="true" className={className} />;
  }

  if (icon === "donation") {
    return <FiGift aria-hidden="true" className={className} />;
  }

  return null;
};

const Navbar = ({ navItems = [] }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            onClick={closeMenu}
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-wide text-orange-300 sm:text-xl"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
            {product.name}
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
            />
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
              className="rounded-md border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition hover:border-orange-400 hover:text-orange-300"
            >
              <span
                className={`block h-0.5 w-5 bg-current transition ${
                  isMenuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`mt-1 block h-0.5 w-5 bg-current transition ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`mt-1 block h-0.5 w-5 bg-current transition ${
                  isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </button>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <nav className="rounded-full border border-slate-800/90 bg-slate-900/70 p-1">
              <ul className="flex flex-wrap items-center gap-1">
                {navItems.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `${baseNavItemClass} ${
                            isActive ? activeNavItemClass : ""
                          }`
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <NavItemIcon icon={item.icon} />
                          {item.label}
                        </span>
                      </NavLink>
                    ) : (
                      <a href={item.href} className={baseNavItemClass}>
                        <span className="inline-flex items-center gap-1.5">
                          <NavItemIcon icon={item.icon} />
                          {item.label}
                        </span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
            />
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 md:hidden ${
            isMenuOpen
              ? "mt-4 grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-3">
              <nav className="space-y-1">
                {navItems.map((item) =>
                  item.to ? (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `${mobileNavItemClass} ${
                          isActive ? "bg-slate-800 text-orange-300" : ""
                        }`
                      }
                    >
                      <NavItemIcon icon={item.icon} />
                      {item.label}
                    </NavLink>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={closeMenu}
                      className={mobileNavItemClass}
                    >
                      <NavItemIcon icon={item.icon} />
                      {item.label}
                    </a>
                  ),
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
