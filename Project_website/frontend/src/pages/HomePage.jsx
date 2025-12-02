// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import Container from "../components/Container";
// import { getCommunities } from "../utils/api";
import { apiGet } from "../utils/api";

export default function HomePage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  apiGet("/communities")
    .then((data) => {
      setCommunities(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching communities:", err);
      setLoading(false);
    });
}, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav />

      {/* Hero Section */}
      <div className="relative">
        {/* 1. The Background Image */}
        <img
          src="/assets/Mithi,_Sindh_2018.jpg" // banner from public/assets
          alt="Living Archives Banner"
          // NOTE: Removed shadow-lg from here, added to the overlay below
          className="w-full h-64 md:h-96 object-cover "
        />

        {/* 2. NEW: Dark Overlay */}
        {/* This div sits absolutely on top of the image.
            bg-black/60 means black background with 60% opacity.
            Change /60 to /50 or /70 to adjust darkness.
            We add rounded-b-3xl and shadow-lg here so it matches the image shape. */}
        <div className="absolute inset-0 bg-black/50 "></div>


        {/* 3. The Text Content */}
        {/* Added z-10 to ensure this sits on top of the overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-4 md:px-0">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
            Living Archives
          </h1>
          {/* Removed shadow-md from the paragraph as the dark background is enough now */}
          <p className="text-white md:text-lg px-4 md:px-0">
            Documenting Sindh's communities through immersive multimedia and 3D experiences.
          </p>
          <div className="flex mt-6 space-x-4">
            <Link
              to="/explore"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white font-medium shadow-lg hover:scale-105 transition-all"
            >
              Explore Communities
            </Link>
            <Link
              to="/search"
              // Added hover:border-transparent so the border doesn't clash with the white hover bg
              className="px-6 py-3 rounded-full border border-white text-white font-medium hover:bg-white hover:text-[#5C4033] hover:border-transparent transition-all"
            >
              Search Archives
            </Link>
          </div>
        </div>
      </div>
      {/* Featured Communities */}
      <Container>
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mt-12 mb-8 bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
          Featured Communities
        </h2>

        {loading ? (
          <p className="text-center text-gray-700">Loading communities...</p>
        ) : communities.length === 0 ? (
          <p className="text-center text-gray-700">No communities found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.slice(0, 3).map((c) => (
              <Link
                key={c._id}
                to={`/community/${c._id}`}
                className="group relative block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-white/70 backdrop-blur-sm border border-[#D2B48C] transition-transform transform hover:-translate-y-1 duration-300"
              >
                <img
                  src={`/assets/${c.coverImage}`} // community images from public/assets
                  alt={c.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-[#8B5E3C]">{c.name}</h3>
                  <p className="text-gray-700 text-sm mt-1 line-clamp-2">{c.description}</p>
                  <span className="text-[#5C4033] font-medium mt-2 inline-block group-hover:underline">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>

      {/* About Project */}
      <Container>
        <section className="mt-12 bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-[#D2B48C] text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
            About Living Archives
          </h2>
          <p className="text-gray-700 text-lg max-w-3xl mx-auto">
            A Kaavish initiative preserving Sindh’s cultural heritage with multimedia documentation and immersive 3D tours.
          </p>
          <div className="flex justify-center mt-6 space-x-4">
            <Link
              to="/about"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white font-medium shadow hover:scale-105 transition-all"
            >
              Learn More
            </Link>
          </div>
        </section>
      </Container>
    </div>
  );
}
