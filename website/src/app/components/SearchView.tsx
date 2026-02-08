import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import { searchArchive } from "../../services/search";
import { getArchiveStats } from "../../services/archivestats";

interface SearchViewProps {
  onNavigate: (view: string) => void;
}
interface SearchArchiveResponse {
  interviews: any[];
  media: any[];
}

interface SearchResult {
  id: string;
  type: "Audio" | "Image" | "Video" | "PDF" | "3D";
  title: string;
  community: string;
  date: string;
  summary?: string;   // raw searchable text
  snippet?: string;   // extracted preview
}
function highlight(text: string | null | undefined, query: string) {
  if (!text) return "";      // ⭐ THIS FIX PREVENTS CRASH
  if (!query) return text;

  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-accent/30 text-accent px-1 rounded">
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



export function SearchView({ onNavigate }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
    const runSearch = async () => {
      if (searchQuery.length === 0) {
        setSearchResults([]);
        return;
      }

      const data = await searchArchive(searchQuery);

      // interviews → AUDIO
      const audioResults: SearchResult[] = data.interviews.map((item: any) => {
  const summaryText = item.summary_text || "";


  const snippet =
  extractSnippet(summaryText, searchQuery) ??
  summaryText.slice(0, 180);
// console.log("SUMMARY:", item.id, item.summary_html);

return {
  id: item.id,
  type: "Audio",
  title: item.title,
  community: item.communities?.name || "Unknown",
  date: item.date,
  summary: summaryText,
  snippet,
};

});


      // media_items → IMAGE / VIDEO / PDF / 3D
const mediaResults: SearchResult[] = data.media.map((item: any) => {
  const description = item.description || "";

  // convert ["temple","god"] → "temple, god"
  const tagsText = Array.isArray(item.tags) ? item.tags.join(", ") : "";

  const fallbackTitle = tagsText || "Untitled Image";

  return {
    id: item.id,
    type: "Image",
    title: item.title || fallbackTitle,     // ⭐ FIX
    community: item.communities?.name || "Unknown",
    date: "",
    summary: description || tagsText,       // ⭐ FIX
    snippet: extractSnippet(description || tagsText, searchQuery),
  };
});




      setSearchResults([...audioResults, ...mediaResults]);
    };

    runSearch();
  }, [searchQuery]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
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
            className="text-6xl mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Search Archives
          </h1>
         {stats.totalItems > 0 && (
  <p className="text-sm opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>
    {stats.totalItems} ITEMS · {stats.totalCommunities} COMMUNITIES · 180GB DATA
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH THE ARCHIVE..."
              className="w-full bg-transparent border-b-2 border-foreground focus:border-accent outline-none py-6 pr-12 transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "1.5rem",
                caretColor: "#CC7722",
              }}
            />
            <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 opacity-40" />
          </div>
          <p
            className="text-xs opacity-60 mt-4"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Search by keyword, community, type, or archive ID
          </p>
        </motion.div>

        {/* Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <p
                className="text-sm opacity-60"
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
                    } else if (result.type === "Video") {
                      onNavigate(`video:${result.id}`);
                    } else if (result.type === "PDF") {
                      onNavigate(`pdf:${result.id}`);
                    } else if (result.type === "3D") {
                      onNavigate(`3d-tour:${result.id}`);
                    }
                  }}
                  className="w-full text-left border-b border-border hover:bg-secondary/30 transition-colors py-6 group"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div
                      className="col-span-2 text-sm opacity-60"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {result.id}
                    </div>
                    <div className="col-span-1">
                      <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                        {result.type}
                      </span>
                    </div>
                    <div className="col-span-5">
  <div className="group-hover:text-accent transition-colors">
    {highlight(result.title, searchQuery)}
  </div>

  {result.snippet && (
    <p className="mt-2 text-sm opacity-60 leading-relaxed">
      {highlight(result.snippet, searchQuery)}
    </p>
  )}
</div>

                    <div
                      className="col-span-2 text-sm opacity-60"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {result.community}
                    </div>
                    <div
                      className="col-span-2 text-sm opacity-60 text-right"
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
        {searchQuery.length === 0 && (
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
