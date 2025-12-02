// MediaPage.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import BackButton from "../components/BackButton";
import Container from "../components/Container";
// import { DUMMY_MEDIA } from "../data/dummyData";
import { apiGet } from "../utils/api";


export default function MediaPage() {
  const { communityId } = useParams();
  const media = DUMMY_MEDIA[communityId] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] to-[#EAD7C3]">
      <TopNav />
      <BackButton />
      <Container>
        <h2 className="text-3xl font-bold mb-6">Media Library</h2>

        <div className="space-y-3">
          {media.map((m) => (
            <Link
              key={m.id}
              to={`/community/${communityId}/media/${m.id}`}
              className="block p-4 border rounded-xl bg-white shadow"
            >
              <strong>{m.title}</strong> — {m.type.toUpperCase()}
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
