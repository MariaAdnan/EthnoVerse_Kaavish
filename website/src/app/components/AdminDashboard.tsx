// src/app/components/AdminDashboard.tsx
import { motion } from "motion/react";
import { Box, Database, Loader2, Plus, Upload, Users } from "lucide-react";
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
import { getModelDownloadUrl } from "../../lib/modal";
import { BUILT_IN_TOUR_COMMUNITY_ID } from "../../config/archive";
import { errorMessage } from "../../lib/validation";

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
  newUsersThisMonth: 0,
});

const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
const [loading, setLoading] = useState( true);
const [jobs, setJobs] = useState<ModelJob[]>([]);
const [showTourPicker, setShowTourPicker] = useState(false);
const [allCommunities, setAllCommunities] = useState<TourCommunity[]>([]);
const [pendingDelete, setPendingDelete] = useState<RecentActivity | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
useEffect(() => {
  async function loadDashboard() {
    try {
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
      ]);
      const { data: commData } = await supabase
  .from("communities")
  .select("community_id, name, terrain_type");
setAllCommunities(commData || []);
      const jobsData = await getJobs();
      setJobs(jobsData || []);

      setStats(statsData);
      setRecentActivity(activityData);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);
  const confirmDelete = async () => {
  if (!pendingDelete || isDeleting) return;
  try {
    setIsDeleting(true);
    const { error } = await deleteArchiveItem(
      pendingDelete.id,
      pendingDelete.type,
    );

    if (error) {
      console.error(error);
      toast.error("Delete failed.");
      return;
    }

    setRecentActivity(prev => prev.filter(item => item.id !== pendingDelete.id));
    const updatedStats = await getDashboardStats();
    setStats(updatedStats);
    setPendingDelete(null);
    toast.success("Archive item deleted.");
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
        className="border-b border-border p-8"
      >
        <div className="max-w-7xl mx-auto">
          <p 
            className="text-sm mb-2 opacity-80"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ADMINISTRATIVE INTERFACE
          </p>
          <h1 
            className="text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Dashboard
          </h1>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-8">
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
{loading ? "—" : stats.newUsersThisMonth}
            </p>
            <p className="text-sm text-muted-foreground">
              Active researchers this month · +18% growth
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

{showTourPicker && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8">
    <div className="bg-background border border-border p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
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
            className="border border-border p-4 mb-3 flex items-center justify-between gap-4"
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
      onChange={async (e) => {
        if (!e.target.value) return;
        await updateCommunityTerrain(c.community_id, e.target.value);
        setAllCommunities(prev =>
          prev.map(x => x.community_id === c.community_id
            ? { ...x, terrain_type: e.target.value }
            : x
          )
        );
      }}
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
{job.status === "done" && getModelDownloadUrl(job.object_name) && (
  <a
    href={getModelDownloadUrl(job.object_name)!}
    download={`${job.object_name}_point_cloud.ply`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs px-3 py-2 border border-green-600 rounded text-green-600 hover:bg-green-600/10 shrink-0"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    DOWNLOAD .PLY →
  </a>
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
                <div key={item.id} className="flex items-center justify-between gap-4 p-4">
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
                “{pendingDelete.title}” will be permanently removed from the archive.
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
