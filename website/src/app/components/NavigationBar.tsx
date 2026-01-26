// src/app/components/NavigationBar.tsx
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
      <div className="backdrop-blur-xl bg-[#F5F1E8]/80 border-b border-[#1A1A1A]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="hover:opacity-80 transition-opacity flex-shrink-0 mr-12"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="text-lg md:text-xl font-bold text-[#1A1A1A]">
              LIVING ARCHIVES
            </span>
          </button>

          <div className="flex-1 flex items-center justify-between">
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
                  <span className="text-xs md:text-sm tracking-wide text-[#1A1A1A]">
                    EXPLORE
                  </span>
                </button>

                {isExploreOpen && (
                  <div className="absolute top-full left-0 pt-4">
                    <div className="bg-[#F5F1E8] border border-[#1A1A1A]/10 rounded-sm shadow-xl py-2 min-w-[240px]">
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
                            className="w-full text-left px-5 py-3 text-xs flex justify-between items-center hover:bg-[#1A1A1A]/5"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            <span>{community.name.toUpperCase()}</span>
                            <span>›</span>
                          </button>

                          {/* Level 2 */}
                          {hoveredCommunity?.community_id ===
                            community.community_id && (
                            <div className="absolute left-full top-0 -ml-1 pl-4">
                              <div className="bg-[#F5F1E8] border border-[#1A1A1A]/10 rounded-sm shadow-xl py-2 min-w-[280px]">
                                <button
                                  onClick={() =>
                                    onNavigate(
                                      `community:${community.community_id}:visual`
                                    )
                                  }
                                  className="w-full text-left px-5 py-3 text-xs hover:bg-[#1A1A1A]/5 hover:text-[#CC7722]"
                                  style={{
                                    fontFamily: "'Space Mono', monospace",
                                  }}
                                >
                                  VISUAL MEDIA (Photos/Videos)
                                </button>

                                <button
                                  onClick={() =>
                                    onNavigate(
                                      `community:${community.community_id}:audio`
                                    )
                                  }
                                  className="w-full text-left px-5 py-3 text-xs hover:bg-[#1A1A1A]/5 hover:text-[#CC7722]"
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
                                  className="w-full text-left px-5 py-3 text-xs hover:bg-[#1A1A1A]/5 hover:text-[#CC7722]"
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
                  <span className="text-xs md:text-sm tracking-wide text-[#1A1A1A]">
                    {item.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

            {/* Admin */}
            <button
              onClick={() => onNavigate("admin-login")}
              className="px-5 py-2 rounded-full border border-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-[#F5F1E8] transition-all"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <span className="text-xs font-medium tracking-wide">ADMIN</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
