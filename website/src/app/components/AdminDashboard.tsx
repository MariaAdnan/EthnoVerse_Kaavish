// src/app/components/AdminDashboard.tsx
import { motion } from "motion/react";
import { BookOpen, Box, Database, Loader2, LogOut, Plus, Upload, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  getDashboardStats, 
  getRecentActivity,
  deleteArchiveItem,
  type RecentActivity,
} from "../../services/admin";
import { getJobs, type ModelJob } from "../../services/jobs";
import { supabase } from "../../lib/supabase";
import { updateCommunityTerrain } from "../../services/communities";
import { downloadModel } from "../../lib/modal";
import { BUILT_IN_TOUR_COMMUNITY_ID } from "../../config/archive";
import { errorMessage } from "../../lib/validation";
import { adminLogout } from "../../services/auth";
import { withTimeout } from "../../lib/async";

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

interface TourCommunity {
  community_id: string;
  name: string;
  terrain_type: string | null;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
  totalArchives: 0,
  communities: 0,
  newAccountsThisMonth: 0,
});

const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
const [loading, setLoading] = useState( true);
const [jobs, setJobs] = useState<ModelJob[]>([]);
const [showTourPicker, setShowTourPicker] = useState(false);
const [allCommunities, setAllCommunities] = useState<TourCommunity[]>([]);
const [pendingDelete, setPendingDelete] = useState<RecentActivity | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
const [loadError, setLoadError] = useState<string | null>(null);
const [adminEmail, setAdminEmail] = useState<string | null>(null);
const [isSigningOut, setIsSigningOut] = useState(false);
const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);
const [updatingTerrainId, setUpdatingTerrainId] = useState<string | null>(null);
useEffect(() => {
  async function loadDashboard() {
    const [statsResult, activityResult, communitiesResult, jobsResult, sessionResult] =
      await Promise.allSettled([
        withTimeout(getDashboardStats(), 8_000),
        withTimeout(getRecentActivity(), 8_000),
        withTimeout(
          supabase.from("communities").select("community_id, name, terrain_type"),
          8_000,
        ),
        withTimeout(getJobs(), 8_000),
        withTimeout(supabase.auth.getSession(), 8_000),
      ]);

    let partialFailure = false;
    if (statsResult.status === "fulfilled") setStats(statsResult.value);
    else partialFailure = true;
    if (activityResult.status === "fulfilled") setRecentActivity(activityResult.value);
    else partialFailure = true;
    if (communitiesResult.status === "fulfilled" && !communitiesResult.value.error) {
      setAllCommunities(communitiesResult.value.data || []);
    } else partialFailure = true;
    if (jobsResult.status === "fulfilled") setJobs(jobsResult.value || []);
    else partialFailure = true;
    if (sessionResult.status === "fulfilled") {
      setAdminEmail(sessionResult.value.data.session?.user.email ?? null);
    } else partialFailure = true;

    if (partialFailure) {
      setLoadError("Some dashboard data could not be loaded.");
    }
    setLoading(false);
  }

  loadDashboard();
}, []);

const handleLogout = async () => {
  if (isSigningOut) return;
  try {
    setIsSigningOut(true);
    await adminLogout();
    onNavigate("admin-login");
  } catch (error) {
    toast.error(errorMessage(error, "Sign out failed."));
  } finally {
    setIsSigningOut(false);
  }
};

const handleModelDownload = async (job: ModelJob) => {
  if (downloadingJobId) return;
  try {
    setDownloadingJobId(job.id);
    await downloadModel(job.id, `${job.object_name}_point_cloud.ply`);
  } catch (error) {
    toast.error(errorMessage(error, "Model download failed."));
  } finally {
    setDownloadingJobId(null);
  }
};

const handleTerrainChange = async (communityId: string, terrainType: string) => {
  if (!terrainType || updatingTerrainId) return;
  try {
    setUpdatingTerrainId(communityId);
    const { error } = await withTimeout(
      updateCommunityTerrain(communityId, terrainType),
      8_000,
    );
    if (error) throw error;
    setAllCommunities((current) =>
      current.map((community) =>
        community.community_id === communityId
          ? { ...community, terrain_type: terrainType }
          : community,
      ),
    );
    toast.success("Community terrain saved.");
  } catch (error) {
    toast.error(errorMessage(error, "Terrain could not be saved."));
  } finally {
    setUpdatingTerrainId(null);
  }
};
  const confirmDelete = async () => {
  if (!pendingDelete || isDeleting) return;
  try {
    setIsDeleting(true);
    const { data, error } = await deleteArchiveItem(
      pendingDelete.id,
      pendingDelete.type,
    );

    if (error) {
      console.error(error);
      toast.error("Delete failed.");
      return;
    }

    setRecentActivity((current) =>
      current.filter(
        (item) => !(item.id === pendingDelete.id && item.type === pendingDelete.type),
      ),
    );
    const updatedStats = await withTimeout(getDashboardStats(), 8_000);
    setStats(updatedStats);
    setPendingDelete(null);
    if (data?.cleanupWarning) {
      toast.warning("Archive item deleted, but its Cloudinary file needs manual cleanup.");
    } else {
      toast.success("Archive item and its uploaded file were deleted.");
    }
  } catch (err) {
    console.error("Delete error:", err);
    toast.error(errorMessage(err, "Delete failed."));
  } finally {
    setIsDeleting(false);
  }
};

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border px-6 pb-8 pt-32 sm:px-8"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-sm mb-2 opacity-80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              ADMINISTRATIVE INTERFACE
            </p>
            <h1
              className="text-[clamp(2.75rem,10vw,3rem)] leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Dashboard
            </h1>
            {adminEmail && <p className="mt-2 break-all text-sm text-muted-foreground">{adminEmail}</p>}
          </div>
          <button
            type="button"
            disabled={isSigningOut}
            onClick={() => void handleLogout()}
            className="inline-flex items-center justify-center gap-2 border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper disabled:opacity-60"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {isSigningOut ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
            {isSigningOut ? "SIGNING OUT…" : "SIGN OUT"}
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
        {loadError && (
          <div role="alert" className="mb-8 border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
            {loadError} Refresh the page to try again.
          </div>
        )}
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          <div className="border border-border p-8 hover:border-accent transition-colors">
            <div className="flex items-start justify-between mb-4">
              <Database className="w-8 h-8 text-accent" />
              <p 
                className="text-xs opacity-80"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                TOTAL ARCHIVES
              </p>
            </div>
            <p 
              className="text-6xl mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {loading ? "—" : stats.totalArchives}
            </p>
            <p className="text-sm text-muted-foreground">
              Across {stats.communities} communities · Cloud storage
            </p>
          </div>

          <div className="border border-border p-8 hover:border-accent transition-colors">
            <div className="flex items-start justify-between mb-4">
              <Users className="w-8 h-8 text-accent" />
              <p 
                className="text-xs opacity-80"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                USER ACTIVITY
              </p>
            </div>
            <p 
              className="text-6xl mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
{loading ? "—" : stats.newAccountsThisMonth}
            </p>
            <p className="text-sm text-muted-foreground">
              Accounts created during the past 30 days
            </p>
          </div>
        </motion.div>

        {/* Upload Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 space-y-4"
        >
          <button 
            onClick={() => onNavigate('media-upload')}
            className="w-full border-2 border-accent bg-accent/5 hover:bg-accent hover:text-accent-foreground transition-all p-8 group"
          >
            <div className="flex items-center justify-center gap-4">
              <Upload className="w-6 h-6" />
              <span 
                className="text-lg"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                UPLOAD NEW MEDIA
              </span>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('add-community')}
            className="w-full border-2 border-foreground bg-transparent hover:bg-foreground/10 transition-all p-6 group"
          >
            <div className="flex items-center justify-center gap-4">
              <Plus className="w-5 h-5" />
              <span 
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                ADD NEW COMMUNITY
              </span>
            </div>
          </button>

          <button
  onClick={() => setShowTourPicker(true)}
  className="w-full border-2 border-foreground bg-transparent hover:bg-foreground/10 transition-all p-6 group"
>
  <div className="flex items-center justify-center gap-4">
    <Box className="w-5 h-5" />
    <span style={{ fontFamily: "'Space Mono', monospace" }}>
      OPEN 3D TOUR EDITOR
    </span>
  </div>
</button>

          <button
            type="button"
            onClick={() => onNavigate('admin-guidelines')}
            className="w-full border-2 border-foreground bg-transparent hover:bg-foreground/10 transition-all p-6 group"
          >
            <div className="flex items-center justify-center gap-4">
              <BookOpen className="w-5 h-5" />
              <span style={{ fontFamily: "'Space Mono', monospace" }}>
                3D CAPTURE &amp; PUBLISHING GUIDE
              </span>
            </div>
          </button>

{showTourPicker && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-8">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-picker-title"
      className="bg-background border border-border p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
    >
      <h2 id="tour-picker-title" className="text-2xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
        Open Tour Editor
      </h2>
      <p className="text-xs opacity-80 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
        SELECT A COMMUNITY TO EDIT ITS TOUR
      </p>

      {allCommunities.map((c) => {
        const isBuiltInTour =
          c.community_id === BUILT_IN_TOUR_COMMUNITY_ID;
        return (
          <div
            key={c.community_id}
            className="border border-border p-4 mb-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs opacity-50" style={{ fontFamily: "'Space Mono', monospace" }}>
                {isBuiltInTour ? 'BUILT-IN TOUR · INSERT ONLY' : `TERRAIN: ${(c.terrain_type || 'not set').toUpperCase()}`}
              </p>
            </div>

            {/* Terrain selector — only for data-driven terrain tours */}
            {!isBuiltInTour && (
  c.terrain_type ? (
    // Already set — show as read-only
    <span
      className="text-xs px-2 py-1 border border-border opacity-80"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      {c.terrain_type.toUpperCase()}
    </span>
  ) : (
    // Not set yet — show picker
    <select
      defaultValue=""
      aria-label={`Terrain for ${c.name}`}
      disabled={updatingTerrainId === c.community_id}
      onChange={(event) => void handleTerrainChange(c.community_id, event.target.value)}
      className="bg-background border border-accent text-xs px-2 py-1"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      <option value="" disabled>Pick terrain ▼</option>
      <option value="grass">Grassland</option>
      <option value="rocky">Rocky</option>
      <option value="mountains">Mountains</option>
    </select>
  )
)}

            <button
  onClick={() => {
    setShowTourPicker(false);
    onNavigate(`admin-3d-tour:${c.community_id}`);
  }}
  disabled={!isBuiltInTour && !c.terrain_type}
  className={`text-xs px-3 py-2 border shrink-0 ${
    !isBuiltInTour && !c.terrain_type
      ? 'border-border opacity-30 cursor-not-allowed'
      : 'border-accent text-accent hover:bg-accent/10'
  }`}
  style={{ fontFamily: "'Space Mono', monospace" }}
>
  {!isBuiltInTour && !c.terrain_type ? 'SET TERRAIN FIRST' : 'OPEN →'}
</button>
          </div>
        );
      })}

      {allCommunities.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">No communities are available.</p>
      )}

      <button
        onClick={() => setShowTourPicker(false)}
        className="mt-4 text-xs opacity-50 hover:opacity-100"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        CANCEL
      </button>
    </div>
  </div>
)}
        </motion.div>
{/* 3D Tour Jobs */}
{jobs.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.5 }}
    className="mb-12"
  >
    <div className="mb-6 flex items-center justify-between">
      <h2
        className="text-3xl"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        3D Tour Jobs
      </h2>
      <p
        className="text-sm opacity-80"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        MODAL PIPELINE
      </p>
    </div>

    <div className="border border-border divide-y divide-border">
      {jobs.map((job) => (
        <div key={job.id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Status badge */}
          <span className={`text-xs px-2 py-1 rounded font-mono shrink-0 ${
            job.status === "done"      ? "bg-green-500/10 text-green-600" :
            job.status === "failed"    ? "bg-red-500/10 text-red-600" :
            job.status === "processing"? "bg-blue-500/10 text-blue-600" :
                                         "bg-accent/10 text-accent"
          }`}>
            {job.status.toUpperCase()}
          </span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {job.object_name}
            </p>
            <p className="text-xs opacity-50" style={{ fontFamily: "'Space Mono', monospace" }}>
              {job.communities?.name} · {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Progress bar (only when processing) */}
          {job.status === "processing" && (
            <div className="w-32 shrink-0">
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="text-xs opacity-40 mt-1 text-right" style={{ fontFamily: "'Space Mono', monospace" }}>
                {job.progress}%
              </p>
            </div>
          )}

          <button
            onClick={() => onNavigate(`model-processing:${job.id}`)}
            className="text-xs px-3 py-2 border border-accent rounded text-accent hover:bg-accent/10 shrink-0"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            VIEW PROGRESS
          </button>

          {/* Tour link when done */}
{job.status === "done" && (
  <button
    type="button"
    disabled={downloadingJobId === job.id}
    onClick={() => void handleModelDownload(job)}
    className="text-xs px-3 py-2 border border-green-600 rounded text-green-600 hover:bg-green-600/10 shrink-0"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    {downloadingJobId === job.id ? "PREPARING…" : "DOWNLOAD .PLY →"}
  </button>
)}
        </div>
      ))}
    </div>
  </motion.div>
)}
        {recentActivity.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Recent Activity</h2>
            <div className="border border-border divide-y divide-border">
              {recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 p-4">
                  <div><p className="text-sm">{item.title}</p><p className="text-xs opacity-50">{item.type} · {new Date(item.date).toLocaleDateString()}</p></div>
                  <button onClick={() => setPendingDelete(item)} className="text-xs text-destructive hover:underline">DELETE</button>
                </div>
              ))}
            </div>
          </motion.section>
        )}
        {pendingDelete && (
          <div
            className="fixed inset-0 z-[70] grid place-items-center bg-foreground/60 p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDeleting) {
                setPendingDelete(null);
              }
            }}
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-description"
              className="w-full max-w-md border border-border bg-background p-8 shadow-xl"
            >
              <h2 id="delete-dialog-title" className="text-2xl mb-3">
                Delete archive item?
              </h2>
              <p id="delete-dialog-description" className="text-muted-foreground mb-8">
                “{pendingDelete.title}” and its associated uploaded file will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setPendingDelete(null)}
                  className="border border-border px-4 py-2 disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => void confirmDelete()}
                  className="bg-destructive text-destructive-foreground px-4 py-2 disabled:cursor-wait disabled:opacity-80 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {isDeleting ? "DELETING…" : "DELETE"}
                </button>
              </div>
            </section>
          </div>
        )}
              </div>
            </div>
          );
        }
