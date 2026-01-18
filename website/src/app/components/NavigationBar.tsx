// /src/app/components/NavigationBar.tsx
import { useEffect, useState } from "react";
import { getAllCommunities } from "../../services/communities";

interface NavigationBarProps {
  onNavigate: (view: string) => void;
}

interface Community {
  community_id: string;
  name: string;
  slug?: string;
}

const categories = [
  "VISUAL MEDIA (Photos/Videos)",
  "INTERVIEWS (Oral Histories)",
  "TEXT / DOCUMENTS (Manuscripts)",
];

export function NavigationBar({ onNavigate }: NavigationBarProps) {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [hoveredCommunity, setHoveredCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await getAllCommunities();
      if (!error && data) {
        setCommunities(data);
      }
    };
    fetchCommunities();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Frosted Glass Nav Bar */}
      <div
        className="backdrop-blur-xl bg-background/80 border-b border-white/20"
        style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-lg md:text-xl tracking-[-0.05em] font-bold">
              LIVING ARCHIVES
            </span>
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-6 md:gap-12">
            <div className="flex items-center gap-4 md:gap-8">
              {/* EXPLORE */}
              <div
                className="relative"
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
                  <span className="text-xs md:text-sm">EXPLORE</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-foreground transition-all duration-300 group-hover:w-full" />
                </button>

                {/* Safe hover zone */}
                {isExploreOpen && (
                  <div className="absolute top-full left-0 w-full h-2" />
                )}

                {/* Communities Dropdown */}
                {isExploreOpen && (
                  <div
                    className="absolute top-full left-0 mt-0 backdrop-blur-xl bg-background/90 border border-white/20 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      minWidth: "220px",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                    }}
                  >
                    <div className="py-2">
                      {communities.map((community) => (
                        <div
                          key={community.community_id}
                          className="relative"
                          onMouseEnter={() => setHoveredCommunity(community)}
                        >
                          <button
                            onClick={() =>
                              onNavigate(`community:${community.community_id}`)
                            }
                            className="w-full text-left px-4 py-2.5 text-xs transition-all duration-200 flex items-center justify-between group/item hover:bg-foreground/5 rounded-md mx-2"
                            style={{ width: "calc(100% - 16px)" }}
                          >
                            <span className="group-hover/item:translate-x-1 transition-transform duration-200">
                              {community.name.toUpperCase()}
                            </span>
                            <span className="text-sm opacity-50 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all duration-200">
                              ›
                            </span>
                          </button>

                          {/* Categories */}
                          {hoveredCommunity?.community_id ===
                            community.community_id && (
                            <div
                              className="absolute left-full top-0 ml-2 backdrop-blur-xl bg-background/90 border border-white/20 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
                              style={{
                                fontFamily: "'Space Mono', monospace",
                                minWidth: "300px",
                                boxShadow:
                                  "0 8px 32px rgba(0, 0, 0, 0.12)",
                              }}
                            >
                              <div className="py-2">
                                {categories.map((category) => (
                                  <button
                                    key={category}
                                    onClick={() =>
                                      onNavigate(
                                        `community:${community.community_id}`
                                      )
                                    }
                                    className="w-full text-left px-4 py-2.5 text-xs transition-all duration-200 hover:bg-foreground/5 rounded-md mx-2 group/cat"
                                    style={{ width: "calc(100% - 16px)" }}
                                  >
                                    <span className="group-hover/cat:translate-x-1 transition-transform duration-200 inline-block">
                                      {category}
                                    </span>
                                  </button>
                                ))}
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
                  <span className="text-xs md:text-sm">
                    {item.toUpperCase()}
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-foreground transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* Admin */}
            <button
              onClick={() => onNavigate("admin-login")}
              className="px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-foreground/30 hover:border-foreground hover:bg-foreground/5 transition-all flex-shrink-0"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-xs md:text-sm">ADMIN</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
