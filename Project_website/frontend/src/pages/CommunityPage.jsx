// frontend/src/pages/CommunityPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import Container from "../components/Container";
import { apiGet } from "../utils/api";

export default function CommunityPage() {
  const { communityId } = useParams(); // use the same param as App.jsx

  const [community, setCommunity] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // 1️⃣ Fetch single community
        const communityRes = await apiGet(`/communities/${communityId}`);
        setCommunity(communityRes);

        // 2️⃣ Fetch media for this community using the route you already have
        const mediaRes = await apiGet(`/media/community/${communityId}`);
        setMedia(mediaRes);
      } catch (err) {
        setError("Failed to load community details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [communityId]);

  if (loading) return <div className="text-center mt-20 text-xl text-gray-700">Loading community...</div>;

  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#EAD7C3]">
      <TopNav />
      <Container>
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg mb-10">
          <img
            src={`/assets/${community.coverImage}`}
            alt={community.name}
            className="w-full h-72 object-cover brightness-75"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-4 bg-black/30">
            <h2 className="text-4xl font-extrabold mb-2 drop-shadow-lg">{community.name}</h2>
            <p className="max-w-2xl text-sm md:text-base opacity-90">{community.description}</p>
            <div className="mt-5 space-x-3">
              <Link
                to={`/community/${communityId}/tour`}
                className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-full font-medium shadow hover:scale-105 transition-all"
              >
                Open 3D Tour
              </Link>
              <Link
                to={`/community/${communityId}/media`}
                className="inline-block bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] text-white px-5 py-2 rounded-full font-medium shadow hover:scale-105 transition-all"
              >
                View Media
              </Link>
            </div>
          </div>
        </div>

        {/* Media Section */}
        <section>
          <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#8B5E3C] to-[#5C4033] bg-clip-text text-transparent">
            Media Collection
          </h3>

          {media.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.map((m) => (
                <Link
                  key={m._id}
                  to={`/community/${communityId}/media/${m._id}`}
                  className="group bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-gray-200 shadow hover:shadow-xl transition hover:-translate-y-1"
                >
                  <div className="relative">
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
                      {m.type === "image" ? (
                        <img
                          src={`/assets/${m.fileName}`}
                          alt={m.title}
                          className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-gray-500 uppercase tracking-wider font-semibold">{m.type}</div>
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 text-xs bg-black/40 text-white px-2 py-0.5 rounded">{m.type}</div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-semibold text-[#8B5E3C]">{m.title}</h4>
                    <p className="text-sm text-gray-600">{m.transcript ? "With transcript" : "No transcript"}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 italic mt-8">No media available for this community yet.</p>
          )}
        </section>
      </Container>
    </div>
  );
}
