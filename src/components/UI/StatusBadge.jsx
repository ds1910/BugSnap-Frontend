import React from "react";

/* ---------- Status Configuration ---------- */
const statusConfig = {
  OPEN: {
    bg: "#E53935", // Red
    hover: "#C62828",
    text: "OPEN",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#E53935"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  "IN PROGRESS": {
    bg: "#1E90FF", // Blue
    hover: "#1C7ED6",
    text: "IN-PROGRESS",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1E90FF"
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
    bg: "#06A435", // Green
    hover: "#05912E",
    text: "RESOLVED",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#06A435"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  CLOSED: {
    bg: "#757575", // Gray
    hover: "#616161",
    text: "CLOSED",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#757575"
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

/* ---------- StatusBadge Component ---------- */
const StatusBadge = ({ status = "OPEN" }) => {
  const normalizedStatus = status?.toUpperCase();
  const config = statusConfig[normalizedStatus] || statusConfig["OPEN"];
  const { bg, hover, text, icon } = config;

  return (
    <div
      className="flex items-center gap-2 rounded-md transition duration-200 cursor-pointer"
      style={{
        backgroundColor: bg,
        width: "140px",
        height: "32px",
        fontFamily: "Inter, sans-serif",
        fontWeight: "bold",
        fontSize: "12px",
        color: "white",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
    >
      <div className="flex items-center justify-center bg-white rounded-full w-4 h-4 ml-2">
        {icon}
      </div>
      <span className="mr-3">{text}</span>
    </div>
  );
};

export default StatusBadge;
