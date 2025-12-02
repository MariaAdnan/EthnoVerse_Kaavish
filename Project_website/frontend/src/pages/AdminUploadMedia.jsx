
import React from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import BackButton from "../components/BackButton";
import Container from "../components/Container";
// import { DUMMY_COMMUNITIES, DUMMY_MEDIA } from "../data/dummyData";
import { apiGet } from "../utils/api";
import { useNavigate } from "react-router-dom";


export default function AdminUploadMedia() {
  const navigate = useNavigate();

  const handleUpload = (e) => {
    e.preventDefault();
    // TODO: upload to server + save metadata
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav isAdmin />
      <Container>
        <h2 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
          Upload Media
        </h2>

        <form
          onSubmit={handleUpload}
          className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-[#D2B48C] space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Select Community
            </label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none">
              <option value="">-- Select Community --</option>
              {DUMMY_COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g., Traditional Tattoo Art"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Media Type
            </label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none">
              <option value="image">Image</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Upload File
            </label>
            <input
              type="file"
              className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-lg p-2 cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Transcript / Notes
            </label>
            <textarea
              placeholder="Optional notes or transcript"
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A67B5B] outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white px-8 py-2 rounded-full font-semibold shadow hover:scale-105 transition-all"
            >
              Upload
            </button>
          </div>
        </form>
      </Container>
    </div>
  );
}