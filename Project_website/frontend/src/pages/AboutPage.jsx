// AboutPage.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import Container from "../components/Container";
// import { DUMMY_COMMUNITIES, DUMMY_MEDIA } from "../data/dummyData";
import { apiGet } from "../utils/api";


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav />
      <Container>
        <section className="max-w-3xl mx-auto text-center bg-white/70 backdrop-blur-sm rounded-2xl p-10 shadow-md border border-[#D2B48C]">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent mb-4">
            About Living Archives
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            <span className="font-semibold text-[#8B5E3C]">Living Archives</span> is a digital storytelling platform that 
            preserves the heritage of Sindh’s diverse communities through immersive multimedia — 
            including photographs, oral histories, audio-visual documentation, and 3D virtual tours.
          </p>

          <p className="text-gray-600 text-base leading-relaxed mb-6">
            The project is a <span className="font-medium text-[#8B5E3C]">Kaavish</span> initiative, 
            designed and developed with the <span className="font-medium text-[#5C4033]">MERN stack</span>, 
            integrating modern web technologies to ensure accessibility, interactivity, and scalability.
          </p>

          <div className="flex justify-center space-x-4 mt-8">
            <Link
              to="/explore"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white text-sm font-medium hover:opacity-90 transition-all shadow-sm"
            >
              Explore Communities
            </Link>
            <Link
              to="/search"
                className="px-5 py-2.5 rounded-full border border-[#8B5E3C] text-[#5C4033] text-sm font-medium hover:bg-[#FAF3E0] transition-all shadow-sm"
            >
              Search Archives
            </Link>
          </div>
        </section>

        <div className="mt-10 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Living Archives · A Kaavish Project
        </div>
      </Container>
    </div>
  );
}