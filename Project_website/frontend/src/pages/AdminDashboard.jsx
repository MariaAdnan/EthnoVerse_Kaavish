// AdminDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import BackButton from "../components/BackButton";
import Container from "../components/Container";
// import { DUMMY_COMMUNITIES, DUMMY_MEDIA } from "../data/dummyData";
import { apiGet } from "../utils/api";


export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav isAdmin />
      <Container>
        <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
          Admin Dashboard
        </h2>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow hover:shadow-lg transition">
            <h4 className="text-lg font-semibold text-[#8B5E3C]">📂 Communities</h4>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {DUMMY_COMMUNITIES.length}
            </p>
          </div>

          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow hover:shadow-lg transition">
            <h4 className="text-lg font-semibold text-[#8B5E3C]">🎞 Media Items</h4>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {Object.values(DUMMY_MEDIA).flat().length}
            </p>
          </div>

          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow hover:shadow-lg transition">
            <h4 className="text-lg font-semibold text-green-700">🕒 Pending Reviews</h4>
            <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <Link
            to="/admin/communities/new"
            className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-full font-medium shadow hover:scale-105 transition"
          >
            + Add Community
          </Link>
          <Link
            to="/admin/media/upload"
            className="inline-block bg-gradient-to-r bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white px-5 py-2 rounded-full font-medium shadow hover:scale-105 transition"
          >
            ⬆ Upload Media
          </Link>
        </div>
      </Container>
    </div>
  );
}