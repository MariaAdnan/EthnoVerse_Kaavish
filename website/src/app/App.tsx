// App.tsx
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
import {PDFViewer } from "./components/PDFviewer";
import { MediaIndex } from "./components/MediaIndex";
import { NavigationBar } from "./components/NavigationBar";
import { AdminGuidelines } from "./components/AdminGuidelines";
import ModelProcessingDemo from "./components/ModelProcessing";

type View = 
  | 'home' | 'explore' | 'community' | '3d-tour' | 'admin-3d-tour' | 'audio' | 'admin' | 'search'
  | 'admin-login' | 'media-upload' | 'about' | 'image-detail' | 'video'
  | 'add-community' | 'contact' | 'pdf' | 'media-index'
  | 'media-visual' | 'media-audio' | 'media-text' | 'model-processing' | 'admin-guidelines';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [history, setHistory] = useState<View[]>(['home']);
const [searchQuery, setSearchQuery] = useState("");
  const handleNavigate = (view: string) => {
    // 1. Special "Parent Back" for Community Detail
    // If we are on 'community' and hit 'back', we want to go to 'explore' or 'home',
    // NOT 'audio' or '3d-tour' even if we just visited them.
    if (view === 'back' && currentView === 'community') {
      // Find the last instance of 'explore' or 'home' in history
      const parentView = [...history].reverse().find(v => v === 'explore' || v === 'home') || 'home';
      
      // Reset history up to that point to avoid loops
      const newHistoryIndex = history.lastIndexOf(parentView);
      const newHistory = history.slice(0, newHistoryIndex + 1);
      
      setHistory(newHistory);
      setCurrentView(parentView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Standard "Back" Action
    if (view === 'back') {
      if (history.length > 1) {
        const newHistory = [...history];
        newHistory.pop(); // Remove current view
        const previousView = newHistory[newHistory.length - 1];
        setHistory(newHistory);
        setCurrentView(previousView);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // 3. Handle "Home" Reset
    if (view === 'home') {
      setHistory(['home']);
      setCurrentView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. Normal Navigation
    if (view !== currentView) {
      setHistory(prev => [...prev, view as View]);
      setCurrentView(view as View);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
{!currentView.startsWith('3d-tour') && !currentView.startsWith('admin-3d-tour') && (
  <NavigationBar onNavigate={handleNavigate} />
)}
      <main>
        {currentView === 'home' && <Homepage onNavigate={handleNavigate} />}
        {currentView === 'explore' && <ExploreCommunities onNavigate={handleNavigate} />}
{currentView.startsWith('community:') && currentView.split(':').length === 2 && (
          <CommunityDetail
            onNavigate={handleNavigate}
            view={currentView}
          />
        )}
{currentView.startsWith('community:') && currentView.endsWith(':visual') && (
  <MediaIndex
    onNavigate={handleNavigate}
    initialFilter="VISUAL"
    communityId={currentView.split(':')[1]}
  />
)}
{currentView.startsWith('community:') && currentView.endsWith(':audio') && (
  <MediaIndex
    onNavigate={handleNavigate}
    initialFilter="AUDIO"
    communityId={currentView.split(':')[1]}
  />
)}
{currentView.startsWith('community:') && currentView.endsWith(':text') && (
  <MediaIndex
    onNavigate={handleNavigate}
    initialFilter="TEXT"
    communityId={currentView.split(':')[1]}
  />
)}
{currentView.startsWith('3d-tour') && (
  <ThreeDTourViewer onNavigate={handleNavigate} view={currentView} />
)}
{currentView.startsWith('admin-3d-tour') && (
  <ThreeDTourViewer onNavigate={handleNavigate} isAdmin view={currentView} />
)}        
        {currentView.startsWith('audio:') && (
          <AudioPlayer
            onNavigate={handleNavigate}
            view={currentView}
          />
        )}
        {currentView === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}
{currentView === 'search' && (
  <SearchView 
    onNavigate={handleNavigate}
    persistedQuery={searchQuery}
    onQueryChange={setSearchQuery}
  />
)}        {currentView === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}
        {currentView === 'media-upload' && <MediaUpload onNavigate={handleNavigate} />}
        {currentView === 'about' && <AboutPage onNavigate={handleNavigate} />}
{currentView.startsWith('image-detail:') && (
  <ImageDetail onNavigate={handleNavigate} view={currentView} />
)}
        {currentView === 'video' && <VideoPlayer onNavigate={handleNavigate} />}
        {currentView === 'add-community' && <AddCommunity onNavigate={handleNavigate} />}
        {currentView === 'contact' && <ContactPage onNavigate={handleNavigate} />}
{currentView.startsWith('pdf') && <PDFViewer onNavigate={handleNavigate} view={currentView} />}

        {/* Media Routes */}
        {currentView === 'media-index' && <MediaIndex onNavigate={handleNavigate} initialFilter="ALL" />}
        {currentView === 'media-visual' && <MediaIndex onNavigate={handleNavigate} initialFilter="VISUAL" />}
        {currentView === 'media-audio' && <MediaIndex onNavigate={handleNavigate} initialFilter="AUDIO" />}
        {currentView === 'media-text' && <MediaIndex onNavigate={handleNavigate} initialFilter="TEXT" />}
        {currentView.startsWith('model-processing') && (
          <ModelProcessingDemo onNavigate={handleNavigate} view={currentView} />
        )}
        {currentView === 'admin-guidelines' && <AdminGuidelines onNavigate={handleNavigate} />}
      </main>
    </div>
  );
}