import React from "react";
import { Flag } from "lucide-react";
import PropTypes from "prop-types";

/**
 * FlagBadge
 * - Shows a small flag icon + label.
 * - On hover, the icon + text highlight using the priority color and a subtle background tint appears.
 *
 * Usage: <FlagBadge priority="low" />
 */

const PRIORITY_STYLES = {
  low: {
    icon: "text-green-400",
    hoverText: "group-hover:text-green-300",
    hoverBg: "group-hover:bg-green-500/10",
  },
  medium: {
    icon: "text-yellow-400",
    hoverText: "group-hover:text-yellow-300",
    hoverBg: "group-hover:bg-yellow-500/10",
  },
  high: {
    icon: "text-orange-400",
    hoverText: "group-hover:text-orange-300",
    hoverBg: "group-hover:bg-orange-500/10",
  },
  critical: {
    icon: "text-red-500",
    hoverText: "group-hover:text-red-400",
    hoverBg: "group-hover:bg-red-600/10",
  },
  DEFAULT: {
    icon: "text-gray-400",
    hoverText: "group-hover:text-gray-300",
    hoverBg: "group-hover:bg-white/5",
  },
};

// ✅ Utility: Capitalize first letter
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "—";

const FlagBadge = ({ priority = null }) => {
  // normalize priority to lowercase for styles
  const key = priority?.toLowerCase();
  const style = PRIORITY_STYLES[key] || PRIORITY_STYLES.DEFAULT;

  return (
    <div
      className={`group inline-flex items-center gap-2 text-sm font-medium px-2 py-1 rounded ${style.hoverBg} transition-colors duration-150`}
      title={priority || "No priority"}
      role="status"
      aria-label={`Priority: ${priority || "None"}`}
    >
      {/* Icon */}
      <Flag className={`w-4 h-4 ${style.icon} ${style.hoverText}`} />

      {/* Label */}
      <span className={`text-white ${style.hoverText}`}>
        {capitalize(priority)}
      </span>
    </div>
  );
};

FlagBadge.propTypes = {
  priority: PropTypes.oneOfType([
    PropTypes.oneOf(["low", "medium", "high", "critical"]),
    PropTypes.string,
  ]),
};

export default FlagBadge;
