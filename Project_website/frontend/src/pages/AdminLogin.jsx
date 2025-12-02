// AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // inline error
  const [loading, setLoading] = useState(false); // optional loading

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Only allow admins
      if (data.user.role !== "admin") {
        setError("You are not authorized to access the admin dashboard");
        return;
      }

      // Navigate to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      setLoading(false);
      setError("Server error. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF3E0]">
      <div className="bg-white p-8 rounded-xl shadow-xl w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Admin Login</h2>

        <input
          type="email"
          placeholder="Enter email"
          className="w-full border p-2 rounded mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          className="w-full border p-2 rounded mb-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          className={`w-full bg-[#5C4033] text-white py-2 rounded ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
