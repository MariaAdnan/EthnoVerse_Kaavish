// src/app/components/AdminDashboard.tsx
import { motion } from "motion/react";
import { Upload, Edit2, Trash2, Users, Database, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  getDashboardStats, 
  getRecentActivity,
  deleteArchiveItem
} from "../../services/admin";

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
useEffect(() => {
  async function loadDashboard() {
    try {
      const [statsData, activityData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
      ]);

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
        </motion.div>

        {/* Recent Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 
              className="text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Recent Activity
            </h2>
            <p 
              className="text-sm opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              LAST 7 DAYS
            </p>
          </div>

          <div className="border border-border">
            {/* Table Header */}
            <div 
              className="grid grid-cols-12 gap-4 p-6 border-b border-border bg-secondary/30 text-sm"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <div className="col-span-2">ID</div>
              <div className="col-span-2">TYPE</div>
              <div className="col-span-4">TITLE</div>
              <div className="col-span-2">DATE</div>
              <div className="col-span-2">ACTIONS</div>
            </div>

            {/* Table Rows */}
            {recentActivity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="grid grid-cols-12 gap-4 p-6 border-b border-border hover:bg-secondary/20 transition-colors group"
              >
                <div 
                  className="col-span-2 text-sm opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {item.id}
                </div>
                <div className="col-span-2">
                  <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                    {item.type}
                  </span>
                </div>
                <div className="col-span-4">{item.title}</div>
                <div 
                  className="col-span-2 text-sm opacity-60"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {item.date}
                </div>
                <div className="col-span-2 flex gap-2">
                  <button className="p-2 hover:bg-accent/10 hover:text-accent transition-colors rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
<button
  onClick={() => handleDelete(item.id, item.type)}
  className="p-2 hover:bg-destructive/10 hover:text-destructive transition-colors rounded"
>                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 p-8 border border-border bg-secondary/20"
        >
          <h3 
            className="text-xl mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            System Information
          </h3>
          <div 
            className="grid md:grid-cols-3 gap-6 text-sm"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <div>
              <p className="opacity-60 mb-2">STACK</p>
              <p>MongoDB, Express, React, Node.js</p>
            </div>
            <div>
              <p className="opacity-60 mb-2">3D RENDERING</p>
              <p>NeRF + Gaussian Splatting</p>
            </div>
            <div>
              <p className="opacity-60 mb-2">VERSION</p>
              <p>v2.4.1 (Stable)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('home')}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← HOME</span>
        </button>
      </div>
    </div>
  );
}