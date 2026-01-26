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

type View = 
  | 'home' | 'explore' | 'community' | '3d-tour' | 'audio' | 'admin' | 'search'
  | 'admin-login' | 'media-upload' | 'about' | 'image-detail' | 'video'
  | 'add-community' | 'contact' | 'pdf' | 'media-index'
  | 'media-visual' | 'media-audio' | 'media-text';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [history, setHistory] = useState<View[]>(['home']);

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
      <NavigationBar onNavigate={handleNavigate} />

      <main>
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
        {currentView === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentView === 'image-detail' && <ImageDetail onNavigate={handleNavigate} view={currentView} />}
        {currentView === 'video' && <VideoPlayer onNavigate={handleNavigate} />}
        {currentView === 'add-community' && <AddCommunity onNavigate={handleNavigate} />}
        {currentView === 'contact' && <ContactPage onNavigate={handleNavigate} />}
        {currentView === 'pdf' && <PDFViewer onNavigate={handleNavigate} />}

        {/* Media Routes */}
        {currentView === 'media-index' && <MediaIndex onNavigate={handleNavigate} initialFilter="ALL" />}
        {currentView === 'media-visual' && <MediaIndex onNavigate={handleNavigate} initialFilter="VISUAL" />}
        {currentView === 'media-audio' && <MediaIndex onNavigate={handleNavigate} initialFilter="AUDIO" />}
        {currentView === 'media-text' && <MediaIndex onNavigate={handleNavigate} initialFilter="TEXT" />}
      </main>
    </div>
  );
}