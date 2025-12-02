//frontend/src/App.jsx
// @ts-nocheck

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
// import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import CommunityPage from "./pages/CommunityPage";
import VirtualTourPage from "./pages/VirtualTourPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAddCommunity from "./pages/AdminAddCommunity";
import AdminUploadMedia from "./pages/AdminUploadMedia";
import MediaDetailPage from "./pages/MediaPage";
import SearchPage from "./pages/SearchPage";
import AboutPage from "./pages/AboutPage";

/*
  Kaavish - Living Archives
*/

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route path="/community/:communityId" element={<CommunityPage />} />
        <Route path="/community/:communityId/media" element={<CommunityPage />} />
        <Route path="/community/:communityId/media/:mediaId" element={<MediaDetailPage />} />
        <Route path="/community/:communityId/tour" element={<VirtualTourPage />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/communities/new" element={<AdminAddCommunity />} />
        <Route path="/admin/media/upload" element={<AdminUploadMedia />} />

        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}


