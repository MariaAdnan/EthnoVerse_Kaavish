// src/app/components/NavigationBar.tsx
import { useEffect, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";

interface NavigationBarProps {
  onNavigate: (view: string) => void;
  currentView?: string;
}

const NAV_ITEMS = [
  { view: "explore", label: "EXPLORE", href: "/explore" },
  { view: "search", label: "SEARCH", href: "/search" },
  { view: "about", label: "ABOUT", href: "/about" },
  { view: "contact", label: "CONTACT", href: "/contact" },
];

const ADMIN_ITEM = { view: "admin", label: "ADMIN", href: "/admin" };

// Explore covers the community and media pages reached from it.
function isActive(view: string, currentView = "") {
  if (view === "explore") {
    return currentView === "explore" || currentView.startsWith("community:") || currentView.startsWith("media");
  }
  return currentView === view;
}

export function NavigationBar({ onNavigate, currentView }: NavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  // Real links keep "open in new tab" and copy-link working; plain clicks stay in the app.
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, view: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" aria-label="Main">
      <div className="backdrop-blur-xl bg-paper/80 border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            onClick={(event) => handleLinkClick(event, "home")}
            className="hover:opacity-80 transition-opacity flex-shrink-0 md:mr-12"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-lg md:text-xl font-bold text-ink">
              ETHNOVERSE
            </span>
          </a>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center p-2 text-ink md:hidden"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <div className="hidden flex-1 items-center justify-between md:flex">
            <div className="flex items-center gap-8 md:gap-12">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.view, currentView);
                return (
                  <a
                    key={item.view}
                    href={item.href}
                    onClick={(event) => handleLinkClick(event, item.view)}
                    aria-current={active ? "page" : undefined}
                    className={`relative py-2 text-xs md:text-sm tracking-wide text-ink border-b-2 transition-colors hover:border-ink/40 ${
                      active ? "border-accent" : "border-transparent"
                    }`}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>

            <a
              href={ADMIN_ITEM.href}
              onClick={(event) => handleLinkClick(event, ADMIN_ITEM.view)}
              aria-current={isActive(ADMIN_ITEM.view, currentView) ? "page" : undefined}
              className="py-2 text-xs tracking-wide text-ink/70 hover:text-ink transition-colors"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {ADMIN_ITEM.label}
            </a>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-navigation" className="border-t border-ink/10 bg-paper px-4 py-3 md:hidden">
            <div className="grid gap-1">
              {[...NAV_ITEMS, ADMIN_ITEM].map((item) => {
                const active = isActive(item.view, currentView);
                return (
                  <a
                    key={item.view}
                    href={item.href}
                    onClick={(event) => handleLinkClick(event, item.view)}
                    aria-current={active ? "page" : undefined}
                    className={`px-3 py-3 text-left text-sm text-ink hover:bg-ink/5 ${active ? "bg-ink/5" : ""}`}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
