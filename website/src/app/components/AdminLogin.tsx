// src/app/components/AdminLogin.tsx
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { adminLogin } from "../../services/auth";


interface AdminLoginProps {
  onNavigate: (view: string) => void;
}

export function AdminLogin({ onNavigate }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e: FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  const result = await adminLogin(email, password);

  setLoading(false);

  if (result?.error) {
    setError(result.error);
    return;
  }

  // ✅ success
  onNavigate("admin");
};


  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 pb-10 pt-28 md:p-6 md:pt-28">
      {/* Back to Home */}
      <div className="fixed left-4 top-24 z-40 md:left-8 md:top-28">
        <button
          onClick={() => onNavigate('home')}
          className="text-paper hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← HOME</span>
        </button>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="border-2 border-paper bg-ink p-6 sm:p-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 
              className="text-4xl text-paper mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              ADMINISTRATOR
            </h1>
            <p 
              className="text-sm text-paper/80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              ACCESS
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-8">
            {/* Username Field */}
            <div>
              <label 
                htmlFor="admin-email"
                className="block text-xs text-paper/80 mb-3"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                EMAIL
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b-2 border-paper text-paper pb-3 focus:border-accent outline-none transition-colors"
                style={{ 
                  fontFamily: "'Space Mono', monospace",
                  caretColor: 'var(--accent)'
                }}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="admin-password"
                className="block text-xs text-paper/80 mb-3"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                PASSWORD
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b-2 border-paper text-paper pb-3 focus:border-accent outline-none transition-colors"
                style={{ 
                  fontFamily: "'Space Mono', monospace",
                  caretColor: 'var(--accent)'
                }}
                required
              />
            </div>
{error && (
  <p
    role="alert"
    className="text-sm text-red-500 text-center"
    style={{ fontFamily: "'Space Mono', monospace" }}
  >
    {error}
  </p>
)}

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-paper text-ink py-4 hover:bg-accent hover:text-ink transition-colors mt-12 disabled:cursor-wait disabled:opacity-80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {loading ? "SIGNING IN…" : "LOGIN"}
            </motion.button>
          </form>

          {/* Footer Note */}
          <p 
            className="text-xs text-paper/70 text-center mt-8"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            UC-A01 · ADMIN AUTHENTICATION
          </p>
        </div>
      </motion.div>
    </div>
  );
}
