// ==============================
// StatusToggle.jsx (fixed)
// ==============================

import React, { useState } from "react";

const statusConfig = {
  OPEN: {
    bg: "#E53935",
    hover: "#C62828",
    text: "OPEN",
    icon: (c) => (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  "IN PROGRESS": {
    bg: "#1E90FF",
    hover: "#1C7ED6",
    text: "IN PROGRESS",
    icon: (c) => (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  RESOLVED: {
    bg: "#06A435",
    hover: "#05912E",
    text: "RESOLVED",
    icon: (c) => (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  CLOSED: {
    bg: "#757575",
    hover: "#616161",
    text: "CLOSED",
    icon: (c) => (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={c}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="6" y1="18" x2="18" y2="6" />
      </svg>
    ),
  },
};

// Keep order consistent with statusConfig keys
const order = ["OPEN", "IN PROGRESS", "RESOLVED", "CLOSED"];

// Helper to normalize any incoming status string
const normalizeStatus = (s) =>
  (s || "OPEN").toUpperCase();

const StatusToggle = ({ status = "OPEN", onChange }) => {
  const [current, setCurrent] = useState(normalizeStatus(status));

  const next = () => {
    const i = order.indexOf(current);
    const nextStatus = order[(i + 1) % order.length];
    setCurrent(nextStatus);
    onChange?.(nextStatus);
  };

  // fallback to OPEN if not found
  const { bg, hover, text, icon } = statusConfig[current] || statusConfig["OPEN"];

  return (
    <div
      className="flex items-center gap-2 rounded-md transition duration-200 cursor-pointer"
      style={{
        backgroundColor: bg,
        height: 32,
        minWidth: 120,
        padding: "0 10px",
        fontFamily: "Inter, sans-serif",
        fontWeight: "bold",
        fontSize: 12,
        color: "white",
      }}
      onClick={next}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
    >
      <div className="flex items-center justify-center bg-white rounded-full w-4 h-4">
        {icon(bg)}
      </div>
      <span>{text}</span>
    </div>
  );
};

export default StatusToggle;
