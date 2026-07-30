// src/app/components/SearchView.tsx
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { searchArchive } from "../../services/search";
import { getArchiveStats } from "../../services/archivestats";

interface SearchViewProps {
  onNavigate: (view: string) => void;
  persistedQuery: string;
  onQueryChange: (q: string) => void;
}
interface SearchResult {
  id: string;
  type: "Audio" | "Image";
  title: string;
  community: string;
  date: string;
  summary?: string;   // raw searchable text
  snippet?: string;   // extracted preview
}

function communityName(
  community: { name: string }[] | { name: string } | null,
) {
  if (Array.isArray(community)) return community[0]?.name ?? "Unknown";
  return community?.name ?? "Unknown";
}
function highlight(text: string | null | undefined, query: string) {
  if (!text) return "";      // ⭐ THIS FIX PREVENTS CRASH
  if (!query) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLocaleLowerCase() === query.toLocaleLowerCase() ? (
      <mark key={i} className="bg-secondary text-ink px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function extractSnippet(
  text: string,
  query: string,
  radius = 120
): string | undefined {
  if (!text || !query) return undefined;

  const cleanText = text.replace(/\s+/g, " ").toLowerCase();
  const words = query.toLowerCase().split(/\s+/);

  let matchIndex = -1;
  let matchedWord = "";

  for (const word of words) {
    if (word.length < 2) continue; // skip tiny words
    const idx = cleanText.indexOf(word);
    if (idx !== -1) {
      matchIndex = idx;
      matchedWord = word;
      break;
    }
  }

  if (matchIndex === -1) return undefined;

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(
    cleanText.length,
    matchIndex + matchedWord.length + radius
  );

  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end) +
    (end < text.length ? "…" : "")
  );
}



export function SearchView({ onNavigate, persistedQuery, onQueryChange }: SearchViewProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
const [stats, setStats] = useState({
  totalItems: 0,
  totalCommunities: 0,
});

useEffect(() => {
  const fetchStats = async () => {
    const data = await getArchiveStats();
    setStats(data);
  };

  fetchStats();
}, []);

  useEffect(() => {
    let cancelled = false;
    const normalizedQuery = persistedQuery.trim();
    const runSearch = async () => {
if (!normalizedQuery) {
        setSearchResults([]);
        setSearchError(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      try {
const data = await searchArchive(normalizedQuery);

      // interviews → AUDIO
      const audioResults: SearchResult[] = data.interviews.map((item) => {
  const summaryText = item.summary_text || "";


  const snippet =
extractSnippet(summaryText, persistedQuery) ??
  summaryText.slice(0, 180);
// console.log("SUMMARY:", item.id, item.summary_html);

return {
  id: String(item.id),
  type: "Audio",
  title: item.title ?? "Untitled Interview",
  community: communityName(item.communities),
  date: item.date ?? "",
  summary: summaryText,
  snippet,
};

});


const mediaResults: SearchResult[] = data.media.map((item) => {
  const description = item.description || "";

  // convert ["temple","god"] → "temple, god"
  const tagsText = Array.isArray(item.tags) ? item.tags.join(", ") : "";

  const fallbackTitle = tagsText || "Untitled Image";

  return {
    id: String(item.id),
    type: "Image",
    title: item.title || fallbackTitle,     // ⭐ FIX
    community: communityName(item.communities),
    date: "",
    summary: description || tagsText,       // ⭐ FIX
    snippet: extractSnippet(description || tagsText, persistedQuery),
  };
});




      if (!cancelled) setSearchResults([...audioResults, ...mediaResults]);
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : "Search failed. Please try again.");
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    const timeout = window.setTimeout(runSearch, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [persistedQuery]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pb-8 pt-32 md:justify-center md:p-8 md:pt-24">
      {/* Back Navigation */}
      <div className="fixed left-4 top-20 z-40 md:left-8">
        <button
          onClick={() => onNavigate("home")}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← HOME</span>
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {/* Search Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h1
            className="mb-4 text-5xl md:text-6xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Search Archives
          </h1>
         {stats.totalItems > 0 && (
  <p className="text-sm opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
    {stats.totalItems} ITEMS · {stats.totalCommunities}{" "}
    {stats.totalCommunities === 1 ? "COMMUNITY" : "COMMUNITIES"}
  </p>
)}


        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <div className="relative">
            <input
              type="text"
              value={persistedQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="SEARCH THE ARCHIVE..."
              className="w-full bg-transparent border-b-2 border-foreground focus:border-accent outline-none py-6 pr-12 transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "1.5rem",
                caretColor: "var(--accent)",
              }}
            />
            <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 opacity-40" />
          </div>
          <p
            className="text-xs opacity-80 mt-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Search by keyword, community, type, or archive ID
          </p>
        </motion.div>

        {/* Results */}
        {isSearching && (
          <p className="text-sm opacity-80" style={{ fontFamily: "'Space Mono', monospace" }}>
            SEARCHING…
          </p>
        )}
        {searchError && (
          <p className="text-sm text-red-600" role="alert" style={{ fontFamily: "'Space Mono', monospace" }}>
            {searchError}
          </p>
        )}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <p
                className="text-sm opacity-80"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {searchResults.length} RESULTS FOUND
              </p>
            </div>

            <div className="space-y-0 border-t border-border">
              {searchResults.map((result, index) => (
                <motion.button
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  onClick={() => {
                    if (result.type === "Audio") {
                      onNavigate(`audio:${result.id}`);
                    } else if (result.type === "Image") {
                      onNavigate(`image-detail:${result.id}`);
                    }
                  }}
                  className="w-full text-left border-b border-border hover:bg-secondary/30 transition-colors py-6 group"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center md:gap-4">
                    <div
                      className="hidden text-sm opacity-80 md:col-span-2 md:block"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {result.id}
                    </div>
                    <div className="md:col-span-1">
                      <span className="inline-block px-2 py-1 bg-secondary text-ink text-xs rounded">
                        {result.type}
                      </span>
                    </div>
                    <div className="md:col-span-5">
  <div className="group-hover:text-accent transition-colors">
    {highlight(result.title, persistedQuery)}
  </div>

  {result.snippet && (
    <p className="mt-2 text-sm opacity-80 leading-relaxed">
      {highlight(result.snippet, persistedQuery)}
    </p>
  )}
  <p
    className="mt-3 text-xs opacity-80 md:hidden"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    {result.community}
    {result.date ? ` · ${result.date}` : ""}
  </p>
</div>

                    <div
                      className="hidden text-sm opacity-80 md:col-span-2 md:block"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {result.community}
                    </div>
                    <div
                      className="hidden text-right text-sm opacity-80 md:col-span-2 md:block"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {result.date}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {persistedQuery.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground text-lg">
              Begin typing to search through the archives
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
