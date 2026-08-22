// src/app/components/NavigationBar.tsx
import { useEffect, useState } from "react";
import { getAllCommunities } from "../../services/communities";
import { Menu, X } from "lucide-react";
import { isSupabaseConfigured } from "../../lib/supabase";
import { withTimeout } from "../../lib/async";

interface NavigationBarProps {
  onNavigate: (view: string) => void;
}

interface Community {
  community_id: string;
  name: string;
  slug?: string;
}

export function NavigationBar({ onNavigate }: NavigationBarProps) {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredCommunity, setHoveredCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await withTimeout(getAllCommunities(), 8_000);
        if (!error && data) setCommunities(data);
      } catch {
        // The main Explore route still exposes a retryable error state.
      }
    };
    fetchCommunities();
  }, []);

  const navigateAndClose = (view: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-paper/80 border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="hover:opacity-80 transition-opacity flex-shrink-0 md:mr-12"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-lg md:text-xl font-bold text-ink">
              ETHNOVERSE
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center p-2 text-ink md:hidden"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <div className="hidden flex-1 items-center justify-between md:flex">
            <div className="flex items-center gap-8 md:gap-12">
              {/* EXPLORE */}
              <div
                className="relative group h-full flex items-center"
                onMouseEnter={() => setIsExploreOpen(true)}
                onMouseLeave={() => {
                  setIsExploreOpen(false);
                  setHoveredCommunity(null);
                }}
              >
                <button
                  onClick={() => onNavigate("explore")} 
                  className="group relative py-2"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span className="text-xs md:text-sm tracking-wide text-ink">
                    EXPLORE
                  </span>
                </button>

                {isExploreOpen && (
                  <div className="absolute top-full left-0 pt-4">
                    <div className="bg-paper border border-ink/10 rounded-sm shadow-xl py-2 min-w-[240px]">
                      {communities.map((community) => (
                        <div
                          key={community.community_id}
                          className="relative"
                          onMouseEnter={() => setHoveredCommunity(community)}
                        >
                          {/* Community */}
                          <button
                            onClick={() =>
                              onNavigate(`community:${community.community_id}`)
                            }
                            className="w-full text-left px-5 py-3 text-xs flex justify-between items-center hover:bg-ink/5"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            <span>{community.name.toUpperCase()}</span>
                            <span>›</span>
                          </button>

                          {/* Level 2 */}
                          {hoveredCommunity?.community_id ===
                            community.community_id && (
                            <div className="absolute left-full top-0 -ml-1 pl-4">
                              <div className="bg-paper border border-ink/10 rounded-sm shadow-xl py-2 min-w-[280px]">
                                <button
                                  onClick={() =>
                                    onNavigate(
                                      `community:${community.community_id}:visual`
                                    )
                                  }
                                  className="w-full text-left px-5 py-3 text-xs hover:bg-ink/5 hover:text-accent"
                                  style={{
                                    fontFamily: "'Space Mono', monospace",
                                  }}
                                >
                                  VISUAL MEDIA (Photos)
                                </button>

                                <button
                                  onClick={() =>
                                    onNavigate(
                                      `community:${community.community_id}:audio`
                                    )
                                  }
                                  className="w-full text-left px-5 py-3 text-xs hover:bg-ink/5 hover:text-accent"
                                  style={{
                                    fontFamily: "'Space Mono', monospace",
                                  }}
                                >
                                  INTERVIEWS (Oral Histories)
                                </button>

                                <button
                                  onClick={() =>
                                    onNavigate(
                                      `community:${community.community_id}:text`
                                    )
                                  }
                                  className="w-full text-left px-5 py-3 text-xs hover:bg-ink/5 hover:text-accent"
                                  style={{
                                    fontFamily: "'Space Mono', monospace",
                                  }}
                                >
                                  TEXT / DOCUMENTS
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Other Links */}
              {["search", "about", "contact"].map((item) => (
                <button
                  key={item}
                  onClick={() => onNavigate(item)}
                  className="group relative py-2"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span className="text-xs md:text-sm tracking-wide text-ink">
                    {item.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

            {/* Admin */}
            <button
              onClick={() => onNavigate("admin")}
              className="px-5 py-2 rounded-full border border-ink/20 hover:bg-ink hover:text-paper transition-all"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-xs font-medium tracking-wide">ADMIN</span>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-ink/10 bg-paper px-4 py-3 md:hidden">
            <div className="grid gap-1">
              {["explore", "search", "about", "contact", "admin"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigateAndClose(item)}
                  className="px-3 py-3 text-left text-sm text-ink hover:bg-ink/5"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
