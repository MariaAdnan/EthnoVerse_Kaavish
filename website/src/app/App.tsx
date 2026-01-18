// src/app/App.tsx
import { useState } from "react";
import { Homepage } from "./components/Homepage";
import { ExploreCommunities } from "./components/ExploreCommunities";
import { CommunityDetail } from "./components/CommunityDetail";
import { ThreeDTourViewer } from "./components/ThreeDTourViewer";
import { AudioPlayer } from "./components/AudioPlayer";
import { AdminDashboard } from "./components/AdminDashboard";
import { SearchView } from "./components/SearchView";
import { AdminLogin } from "./components/AdminLogin";
import { MediaUpload } from "./components/MediaUpload";
import { AboutPage } from "./components/AboutPage";
import { ImageDetail } from "./components/ImageDetail";
import { VideoPlayer } from "./components/VideoPlayer";
import { AddCommunity } from "./components/AddCommunity";
import { ContactPage } from "./components/ContactPage";

import React from "react";

type View =
  | 'home'
  | 'explore'
  | '3d-tour'
  | `audio:${string}`
  | 'admin'
  | 'search'
  | 'admin-login'
  | 'media-upload'
  | 'add-community'
  | 'about'
  | 'contact'
  | `image:${string}`
  | `video`
  | `community:${string}`;

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {currentView === 'home' && <Homepage onNavigate={handleNavigate} />}
      {currentView === 'explore' && <ExploreCommunities onNavigate={handleNavigate} />}
      {currentView.startsWith('community:') && (
        <CommunityDetail 
          onNavigate={handleNavigate} 
          view={currentView} 
        />  
      )}            
      {currentView === '3d-tour' && <ThreeDTourViewer onNavigate={handleNavigate} />}
{currentView.startsWith('audio:') && (
  <AudioPlayer
    onNavigate={handleNavigate}
    view={currentView}
  />
)}

      {currentView === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}
      {currentView === 'search' && <SearchView onNavigate={handleNavigate} />}
      {currentView === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}
      {currentView === 'media-upload' && <MediaUpload onNavigate={handleNavigate} />}
      {currentView === 'add-community' && (
  <AddCommunity onNavigate={handleNavigate} />
)}

      {currentView === 'about' && <AboutPage onNavigate={handleNavigate} />}
      {currentView === "contact" && <ContactPage onNavigate={handleNavigate} />}

      {currentView.startsWith('image:') && (
  <ImageDetail
    onNavigate={handleNavigate}
    view={currentView}
  />
)}

      {/* {currentView.startsWith('video:') && (
  <VideoPlayer
    onNavigate={handleNavigate}
    view={currentView}
  />
)} */}
    </div>
  );
}