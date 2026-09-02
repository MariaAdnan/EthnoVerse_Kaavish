import { useEffect, useState } from "react";
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
import { AddCommunity } from "./components/AddCommunity";
import { ContactPage } from "./components/ContactPage";
import {PDFViewer } from "./components/PDFviewer";
import { MediaIndex } from "./components/MediaIndex";
import { NavigationBar } from "./components/NavigationBar";
import { AdminGuidelines } from "./components/AdminGuidelines";
import { NotFoundPage } from "./components/NotFoundPage";
import ModelProcessingDemo from "./components/ModelProcessing";
import { AdminGuard } from "./components/AdminGuard";
import { isSupabaseConfigured } from "../lib/supabase";

type View = 
  | 'home' | 'explore' | 'community' | '3d-tour' | 'admin-3d-tour' | 'audio' | 'admin' | 'search'
  | 'admin-login' | 'media-upload' | 'about' | 'image-detail'
  | 'add-community' | 'contact' | 'pdf' | 'media-index'
  | 'media-visual' | 'media-audio' | 'model-processing' | 'admin-guidelines' | 'not-found';

type Route = View | `community:${string}` | `audio:${string}` | `image-detail:${string}` | `pdf:${string}` | `model-processing:${string}` | `3d-tour:${string}` | `admin-3d-tour:${string}`;

const STATIC_PATHS: Record<string, View> = {
  "/": "home",
  "/explore": "explore",
  "/admin": "admin",
  "/admin/login": "admin-login",
  "/admin/upload": "media-upload",
  "/admin/communities/new": "add-community",
  "/admin/guidelines": "admin-guidelines",
  "/about": "about",
  "/contact": "contact",
  "/search": "search",
  "/media": "media-index",
  "/media/visual": "media-visual",
  "/media/audio": "media-audio",
  "/404": "not-found",
};

function routeFromPath(pathname = window.location.pathname): Route {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (STATIC_PATHS[normalized]) return STATIC_PATHS[normalized];

  const parts: string[] = [];
  for (const segment of normalized.split("/").filter(Boolean)) {
    try {
      parts.push(decodeURIComponent(segment));
    } catch {
      return "not-found";
    }
  }
  if (parts[0] === "communities" && parts[1] && parts.length === 2) {
    return `community:${parts[1]}`;
  }
  if (
    parts[0] === "communities" &&
    parts[1] &&
    parts.length === 3 &&
    ["all", "visual", "audio"].includes(parts[2])
  ) {
    return `community:${parts[1]}:${parts[2]}` as Route;
  }
  if (parts[0] === "audio" && parts[1] && parts.length === 2) return `audio:${parts[1]}`;
  if (parts[0] === "images" && parts[1] && parts.length === 2) {
    return `image-detail:${parts[1]}`;
  }
  if (
    parts[0] === "images" &&
    parts[1] &&
    parts[2] &&
    parts.length === 3 &&
    /^\d+(,\d+)*$/.test(parts[2])
  ) {
    return `image-detail:${parts[1]}:${parts[2]}`;
  }
  if (parts[0] === "documents" && parts[1] && parts.length === 2) return `pdf:${parts[1]}`;
  if (parts[0] === "processing" && parts[1] && parts.length === 2) return `model-processing:${parts[1]}`;
  if (parts[0] === "tours" && parts[1] && parts.length === 2) return `3d-tour:${parts[1]}`;
  if (parts[0] === "admin" && parts[1] === "tours" && parts[2] && parts.length === 3) {
    return `admin-3d-tour:${parts[2]}`;
  }
  return "not-found";
}

function pathForRoute(route: Route): string {
  const staticEntry = Object.entries(STATIC_PATHS).find(([, view]) => view === route);
  if (staticEntry) return staticEntry[0];

  const [kind, ...segments] = route.split(":");
  const encoded = segments.map(encodeURIComponent);
  if (kind === "community") return `/communities/${encoded.join("/")}`;
  if (kind === "audio") return `/audio/${encoded.join("/")}`;
  if (kind === "image-detail") return `/images/${encoded.join("/")}`;
  if (kind === "pdf") return `/documents/${encoded.join("/")}`;
  if (kind === "model-processing") return `/processing/${encoded.join("/")}`;
  if (kind === "3d-tour") return `/tours/${encoded.join("/")}`;
  if (kind === "admin-3d-tour") return `/admin/tours/${encoded.join("/")}`;
  return "/404";
}

export default function App() {
  const [currentView, setCurrentView] = useState<Route>(routeFromPath);
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(routeFromPath());
      setSearchQuery(new URLSearchParams(window.location.search).get("q") ?? "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentView !== "search") return;
    const url = new URL(window.location.href);
    if (searchQuery) url.searchParams.set("q", searchQuery);
    else url.searchParams.delete("q");
    window.history.replaceState({ view: currentView }, "", url);
  }, [currentView, searchQuery]);

  const handleNavigate = (view: string) => {
    if (view === 'back') {
      const currentState = window.history.state as { view?: Route } | null;
      if (currentState?.view && window.history.length > 1) window.history.back();
      else handleNavigate("home");
      return;
    }

    const requestedRoute = view as Route;
    const nextPath = pathForRoute(requestedRoute);
    const nextRoute: Route = nextPath === "/404" ? "not-found" : requestedRoute;
    if (nextRoute === currentView) return;
    window.history.pushState({ view: nextRoute }, "", nextPath);
    setCurrentView(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
{!isSupabaseConfigured && (
  <div
    role="status"
    className="bg-destructive px-4 py-3 text-center text-sm text-destructive-foreground"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    LOCAL PREVIEW · Supabase is not configured. Copy <code>.env.example</code> to{" "}
    <code>.env.local</code> and add the project&apos;s current public browser key.
  </div>
)}
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
{currentView.startsWith('community:') && currentView.endsWith(':all') && (
  <MediaIndex
    onNavigate={handleNavigate}
    initialFilter="ALL"
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
{currentView.startsWith('3d-tour') && (
  <ThreeDTourViewer onNavigate={handleNavigate} view={currentView} />
)}
{currentView.startsWith('admin-3d-tour') && (
  <AdminGuard onNavigate={handleNavigate}>
    <ThreeDTourViewer onNavigate={handleNavigate} isAdmin view={currentView} />
  </AdminGuard>
)}        
        {currentView.startsWith('audio:') && (
          <AudioPlayer
            onNavigate={handleNavigate}
            view={currentView}
          />
        )}
        {currentView === 'admin' && (
          <AdminGuard onNavigate={handleNavigate}>
            <AdminDashboard onNavigate={handleNavigate} />
          </AdminGuard>
        )}
{currentView === 'search' && (
  <SearchView 
    onNavigate={handleNavigate}
    persistedQuery={searchQuery}
    onQueryChange={setSearchQuery}
  />
)}        {currentView === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}
        {currentView === 'media-upload' && (
          <AdminGuard onNavigate={handleNavigate}>
            <MediaUpload onNavigate={handleNavigate} />
          </AdminGuard>
        )}
        {currentView === 'about' && <AboutPage />}
{currentView.startsWith('image-detail:') && (
  <ImageDetail onNavigate={handleNavigate} view={currentView} />
)}
        {currentView === 'add-community' && (
          <AdminGuard onNavigate={handleNavigate}>
            <AddCommunity onNavigate={handleNavigate} />
          </AdminGuard>
        )}
        {currentView === 'contact' && <ContactPage onNavigate={handleNavigate} />}
{currentView.startsWith('pdf') && <PDFViewer onNavigate={handleNavigate} view={currentView} />}

        {/* Media Routes */}
        {currentView === 'media-index' && <MediaIndex onNavigate={handleNavigate} initialFilter="ALL" />}
        {currentView === 'media-visual' && <MediaIndex onNavigate={handleNavigate} initialFilter="VISUAL" />}
        {currentView === 'media-audio' && <MediaIndex onNavigate={handleNavigate} initialFilter="AUDIO" />}
        {currentView.startsWith('model-processing') && (
          <AdminGuard onNavigate={handleNavigate}>
            <ModelProcessingDemo onNavigate={handleNavigate} view={currentView} />
          </AdminGuard>
        )}
        {currentView === 'admin-guidelines' && (
          <AdminGuard onNavigate={handleNavigate}>
            <AdminGuidelines onNavigate={handleNavigate} />
          </AdminGuard>
        )}
        {currentView === 'not-found' && <NotFoundPage onNavigate={handleNavigate} />}
      </main>
    </div>
  );
}
