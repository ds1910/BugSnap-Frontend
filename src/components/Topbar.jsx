// ==============================
// Topbar.jsx
// ==============================

import React from "react";

/**
 * Topbar Component
 * - A responsive top navigation bar for the BugSnap app.
 * - Consists of three sections:
 *   1. Left: Logo
 *   2. Center: Search bar
 *   3. Right: Placeholder for future icons/buttons
 */
const Topbar = () => {
  return (
    <div
      className="
        w-full
        min-h-[48px]
        bg-[#303030]
        stroke-[#4C4C4C]
        text-white
        flex
        items-center
        px-4
      "
    >
{/* ---------------- Left Section: Logo ---------------- */}
<div className="flex-1">
  <h1
    className="
      ml-20
      font-[Montserrat]
      font-extrabold
      text-[26px]
      text-white
      tracking-tight
      select-none
      transition-all
      duration-300
      ease-in-out
      cursor-pointer
      hover:text-[#FFFFFF]
      hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]
      hover:scale-105
    "
  >
    BugSnap
  </h1>
</div>


      {/* ---------------- Center Section: Search Bar ---------------- */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-[342px] h-[30px]">
          {/* Magnifying glass icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9C9C] pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>

          {/* Search input */}
          <input
            type="text"
            className="
              font-Inter
              font-bold
              w-full
              h-full
              rounded-[10px]
              pl-8
              pr-2
              text-sm
              placeholder:text-[#9C9C9C]
              text-[#9C9C9C]
              bg-[#4C4C4C]
              outline-none
            "
            placeholder="Search Your Bug"
          />
        </div>
      </div>

      {/* ---------------- Right Section: Placeholder ---------------- */}
      <div className="flex-1">
        {/* Reserved for future icons/buttons (notifications, profile, etc.) */}
      </div>
    </div>
  );
};

export default Topbar;
