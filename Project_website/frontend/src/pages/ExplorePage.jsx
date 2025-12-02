// frontend/src/pages/ExplorePage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import BackButton from "../components/BackButton";
import Container from "../components/Container";
import { apiGet } from "../utils/api";

export default function ExplorePage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const res = await apiGet("/communities"); // GET from backend
        setCommunities(res); // full array
      } catch (err) {
        setError("Failed to load communities.");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  if (loading)
    return (
      <div className="text-center mt-20 text-xl text-gray-700">
        Loading communities...
      </div>
    );

  if (error)
    return <div className="text-center mt-20 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav />
      <BackButton />
      <Container>
        <h2 className="text-4xl font-extrabold text-center mb-10 bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
          Explore Communities
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((c) => (
            <Link
              key={c._id}
              to={`/community/${c._id}`}
              className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl bg-white/70 backdrop-blur-sm border border-[#D2B48C] transition-transform transform hover:-translate-y-1 duration-300"
            >
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={`/assets/${c.coverImage}`} // must match backend field
                  alt={c.name}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-xl font-semibold text-[#8B5E3C] mb-1">
                  {c.name}
                </h3>
                <p className="text-sm text-gray-700 mb-2">{c.description}</p>
                <span className="text-sm text-[#5C4033] font-medium group-hover:underline">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
