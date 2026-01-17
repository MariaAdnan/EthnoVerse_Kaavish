// src/app/components/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Upload, Edit2, Trash2, Users, Database, Plus } from "lucide-react";
import {
  getAdminStats,
  getRecentMedia,
  deleteMedia,
} from "../../services/admin";

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

interface AdminStats {
  mediaCount: number;
  communityCount: number;
}

interface RecentMedia {
  media_id: string;
  media_type: string;
  title: string;
  created_at: string;
  visible: boolean;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const statsData = await getAdminStats();
        const recentData = await getRecentMedia(7);

        setStats(statsData);
        setRecentActivity(recentData);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

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
        {/* Stats */}
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
              {stats?.mediaCount ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Across {stats?.communityCount ?? "—"} communities
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
              —
            </p>
            <p className="text-sm text-muted-foreground">
              Analytics coming soon
            </p>
          </div>
        </motion.div>
{/* Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 space-y-4"

        >
          {/* Upload Media */}
          
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


        {/* Recent Activity */}
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
              LATEST UPLOADS
            </p>
          </div>

          <div className="border border-border">
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

            {!loading &&
              recentActivity.map((item, index) => (
                <motion.div
                  key={item.media_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-4 p-6 border-b border-border hover:bg-secondary/20 transition-colors"
                >
                  <div
                    className="col-span-2 text-sm opacity-60"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {item.media_id.slice(0, 8).toUpperCase()}
                  </div>

                  <div className="col-span-2">
                    <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                      {item.media_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="col-span-4">{item.title}</div>

                  <div
                    className="col-span-2 text-sm opacity-60"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>

                  <div className="col-span-2 flex gap-2">
                    <button
                      // onClick={() =>
                      //   onNavigate(`media-edit:${item.media_id}`)
                      // }
                      className="p-2 hover:bg-accent/10 hover:text-accent transition-colors rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={async () => {
                        const ok = window.confirm(
                          "Delete this media item permanently?"
                        );
                        if (!ok) return;

                        await deleteMedia(item.media_id);
                        setRecentActivity(prev =>
                          prev.filter(m => m.media_id !== item.media_id)
                        );
                      }}
                      className="p-2 hover:bg-destructive/10 hover:text-destructive transition-colors rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
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
      
      {/* Back */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate("home")}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← HOME</span>
        </button>
      </div>
    </div>
  );
}
