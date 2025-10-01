// ==============================
// Topbar.jsx
// ==============================

import React from "react";
import ProfessionalSearchBar from "./UI/ProfessionalSearchBar";

/**
 * Topbar Component
 * - A responsive top navigation bar for the BugSnap app.
 * - Consists of three sections:
 *   1. Left: Logo
 *   2. Center: Professional Search bar with autocomplete
 *   3. Right: User profile
 */
const Topbar = ({ onSearchResults }) => {
  return (
    <div
      className="
        w-full
        h-[64px]
        bg-gradient-to-r
        from-[#2A2A2A]
        via-[#303030]
        to-[#2A2A2A]
        border-b
        border-[#4C4C4C]/50
        text-white
        flex
        items-center
        px-6
        shadow-xl
        backdrop-blur-sm
        relative
        z-10
        before:absolute
        before:inset-0
        before:bg-gradient-to-r
        before:from-indigo-500/5
        before:to-purple-500/5
        before:opacity-50
      "
    >
      {/* ---------------- Left Section: Logo with Icon ---------------- */}
      <div className="flex items-center min-w-[240px]">
        <div className="flex items-center space-x-3 group">
          {/* SVG Logo Icon - Same as FirstPage.jsx */}
          <div className="relative">
            <svg
              className="w-10 h-10 text-indigo-400 group-hover:text-indigo-300 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(129,140,248,0.5)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.103a2.155 2.155 0 010 3.048l-2.484 2.484a2.155 2.155 0 01-3.048 0L9 12M12 2a10 10 0 100 20 10 10 0 000-20z"
              />
            </svg>
            {/* Animated background glow */}
            <div className="absolute inset-0 w-10 h-10 bg-indigo-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          {/* Brand Name - Same as FirstPage.jsx */}
          <h1
            className="
              font-[Montserrat]
              font-bold
              text-[28px]
              tracking-tight
              select-none
              transition-all
              duration-300
              ease-in-out
              cursor-pointer
              group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]
              group-hover:scale-105
              bg-gradient-to-r
              from-white
              via-indigo-200
              to-indigo-400
              bg-clip-text
              text-transparent
              hover:from-indigo-300
              hover:to-purple-400
            "
          >
            bugSnap
          </h1>
        </div>
      </div>

      {/* ---------------- Center Section: Professional Search Bar ---------------- */}
      <div className="flex-1 flex justify-center px-8 relative z-10">
        <div className="w-full max-w-2xl">
          <ProfessionalSearchBar onSearchResults={onSearchResults} />
        </div>
      </div>

      {/* ---------------- Right Section: Empty Space for Balance ---------------- */}
      <div className="flex items-center min-w-[240px] justify-end">
        {/* Empty space to maintain layout balance */}
      </div>
    </div>
  );
};

export default Topbar;
