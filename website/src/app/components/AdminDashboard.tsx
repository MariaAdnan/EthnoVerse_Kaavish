// src/app/components/AdminDashboard.tsx
import { motion } from "motion/react";
import { Box, Upload, Edit2, Trash2, Users, Database, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  getDashboardStats, 
  getRecentActivity,
  deleteArchiveItem
} from "../../services/admin";
import { getJobs } from "../../services/jobs";
import { supabase } from "../../lib/supabase";
import { updateCommunityTerrain } from "../../services/communities";

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
  totalArchives: 0,
  communities: 0,
  newUsersThisMonth: 0,
});

const [recentActivity, setRecentActivity] = useState<any[]>([]);
const [loading, setLoading] = useState( true);
const [jobs, setJobs] = useState<any[]>([]);  
const [showTourPicker, setShowTourPicker] = useState(false);
const [allCommunities, setAllCommunities] = useState<any[]>([]);
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
  const handleDelete = async (id: string, type: string) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this item?");
  if (!confirmDelete) return;

  try {
    const { error } = await deleteArchiveItem(id, type);

    if (error) {
      console.error(error);
      alert("Delete failed.");
      return;
    }

    // remove from UI immediately
    setRecentActivity(prev => prev.filter(item => item.id !== id));

    // update stats
    const updatedStats = await getDashboardStats();
    setStats(updatedStats);

  } catch (err) {
    console.error("Delete error:", err);
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
            className="text-sm mb-2 opacity-60"
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
                className="text-xs opacity-60"
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
                className="text-xs opacity-60"
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
      <p className="text-xs opacity-60 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
        SELECT A COMMUNITY TO EDIT ITS TOUR
      </p>

      {allCommunities.map((c) => {
        const isKolhi = c.community_id === '2c0e586a-3685-4135-8107-b442cdd22d73';
        return (
          <div
            key={c.community_id}
            className="border border-border p-4 mb-3 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs opacity-50" style={{ fontFamily: "'Space Mono', monospace" }}>
                {isKolhi ? 'DEVELOPER BUILT · INSERT ONLY' : `TERRAIN: ${(c.terrain_type || 'not set').toUpperCase()}`}
              </p>
            </div>

            {/* Terrain selector — only for non-Kolhi communities */}
            {!isKolhi && (
  c.terrain_type ? (
    // Already set — show as read-only
    <span
      className="text-xs px-2 py-1 border border-border opacity-60"
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
      <option value="desert">Desert</option>
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
  disabled={!isKolhi && !c.terrain_type}
  className={`text-xs px-3 py-2 border shrink-0 ${
    !isKolhi && !c.terrain_type
      ? 'border-border opacity-30 cursor-not-allowed'
      : 'border-accent text-accent hover:bg-accent/10'
  }`}
  style={{ fontFamily: "'Space Mono', monospace" }}
>
  {!isKolhi && !c.terrain_type ? 'SET TERRAIN FIRST' : 'OPEN →'}
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
        className="text-sm opacity-60"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        RUN COLAB TO PROCESS
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
{job.status === "done" && job.model_url && (
  <a
    href={`https://afifah-uzair-19--ethnoverse-3dgs-download-ply.modal.run?object_name=${job.object_name}`}
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
        {/* Recent Activity Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    {/* Add the rest of the recent activity content here if needed */}
                  </div>
                </motion.div>
              </div>
            </div>
          );
        }
