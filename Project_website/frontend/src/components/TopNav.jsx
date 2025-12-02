import React from "react";
import { Link } from "react-router-dom";

export default function TopNav({ isAdmin }) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">Living Archives</Link>
        <nav className="space-x-4">
          <Link to="/explore" className="text-sm">Explore</Link>
          <Link to="/about" className="text-sm">About</Link>
          {isAdmin ? <Link to="/admin" className="text-sm font-medium">Admin</Link> : null}
        </nav>
      </div>
    </header>
  );
}
