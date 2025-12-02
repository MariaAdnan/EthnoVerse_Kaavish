// AdminAddCommunity.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import Container from "../components/Container";
import { DUMMY_COMMUNITIES, DUMMY_MEDIA } from "../data/dummyData";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";


export default function AdminAddCommunity() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: connect to API
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav isAdmin />
      <Container>
        <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
          Add / Edit Community
        </h2>

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-[#D2B48C] space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Community Name
            </label>
            <input
              placeholder="e.g., Kolhi (Tharparkar)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Brief background of the community"
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none resize-none"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Thumbnail URL
            </label>
            <input
              placeholder="Paste an image URL"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none"
            />
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:scale-105 transition-all"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full font-semibold hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </Container>
    </div>
  );
}