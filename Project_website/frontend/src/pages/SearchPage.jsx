import React from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import BackButton from "../components/BackButton";
import Container from "../components/Container";
// import { DUMMY_COMMUNITIES, DUMMY_MEDIA } from "../data/dummyData";
import { apiGet } from "../utils/api";



export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const results = React.useMemo(() => {
    if (!query) return DUMMY_COMMUNITIES;
    return DUMMY_COMMUNITIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav />
      <Container>
        <h2 className="text-4xl font-extrabold mb-6 text-center bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
          Search Communities
        </h2>

        {/* Search Bar */}
        <div className="flex justify-center mb-10">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍  Search communities or media..."
            className="w-full max-w-2xl p-4 rounded-full border border-gray-300 shadow-sm bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-[#A67B5B] outline-none text-gray-800 transition-all"
          />
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((c) => (
              <Link
                key={c.id}
                to={`/community/${c.id}`}
                className="group relative block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white/80 backdrop-blur-sm border border-[#D2B48C]"
              >
                <img
                  src={c.thumbnail}
                  alt={c.name}
                  className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">
                    {c.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {c.description}
                  </p>
                  <span className="text-[#5C4033] text-sm font-medium mt-2 inline-block group-hover:underline">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 mt-16">
            No results found for <span className="font-semibold">"{query}"</span> 😔
          </div>
        )}
      </Container>
    </div>
  );
}
