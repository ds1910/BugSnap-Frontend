import React from "react";
import StatusToggle from "../UI/StatusToggle";
import FlagBadge from "../UI/FlagBadge";
import AssignBugBadge from "../UI/AssignBugBadge";
import { Calendar, MessageSquare, Trash2, User } from "lucide-react";

/**
 * BugRow Component
 * ----------------
 * Represents a single task/bug in a list or table.
 * Features:
 * 1. Displays all task fields: name, assignee, due date, priority, status, comments
 * 2. Includes actionable buttons (status toggle, delete)
 * 3. Hover effects for better UX
 * 
 * Props:
 * - id: unique identifier for the bug/task (used for delete)
 * - name: task title
 * - assignedName: array of assigned users
 * - dueDate: string (date or "TBD")
 * - priority: string (e.g., Low, Medium, High)
 * - status: string (used by StatusToggle)
 * - comments: number of comments on the task
 * - onDelete: function to delete the task
 * - openBugDetail: OPTIONAL function to open the bug detail view (receives bug object)
 */
const BugRow = ({
  id,
  name,
  assignedName, // Changed from assignee to assignedName to match API
  dueDate,
  priority,
  status,
  comments,
  onDelete,
  openBugDetail, // added: optional callback to open detail (parent replaces list)
}) => {
  // create a bug object to pass to detail view when requested
  const bug = { id, name, assignedName, dueDate, priority, status, comments };

  const handleRowClick = () => {
    if (typeof openBugDetail === "function") {
      openBugDetail(bug);
    }
  };

  const handleDeleteClick = (e) => {
    // stop propagation so clicking delete doesn't open the detail view
    e.stopPropagation();
    if (typeof onDelete === "function") onDelete(id);
  };

  const handleKeyDown = (e) => {
    // allow Enter or Space to open detail (accessibility)
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleRowClick}
      className="grid grid-cols-7 items-center py-2 border-b border-gray-700 
                 text-sm hover:bg-[#3A3A3A] transition cursor-pointer"
    >
      {/* -------------------------
          Task Name Column
      ------------------------- */}
      <div className="font-medium">{name}</div>

      {/* -------------------------
          Assignee Column
          Shows compact assignee avatars with initials
          Uses new AssignBugBadge component in compact mode
      ------------------------- */}
      <div className="flex items-center">
        <AssignBugBadge
          value={assignedName || []}
          onChange={() => {}} // Read-only in list view
          compact={true}
        />
      </div>

      {/* -------------------------
          Due Date Column
          Shows calendar icon + due date string
      ------------------------- */}
      <div className="ml-5 flex items-center gap-1 text-gray-300">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span>{dueDate}</span>
      </div>

      {/* -------------------------
          Priority Column
          Uses FlagBadge component for colored priority indicator
      ------------------------- */}
      <div className="ml-10">
        <FlagBadge priority={priority} />
      </div>

      {/* -------------------------
          Status Column
          Uses StatusToggle component for interactive status updates
          WARNING: StatusToggle manages its own internal state. 
          If you want to sync with parent state, pass onChange prop.
      ------------------------- */}
      <div className="ml-5">
        <StatusToggle status={status} />
      </div>

      {/* -------------------------
          Comments Column
          Shows number of comments with icon
      ------------------------- */}
      <div className="ml-25 flex items-center gap-1 text-gray-400">
        <MessageSquare className="w-4 h-4" />
        <span>{comments}</span>
      </div>

      {/* -------------------------
          Actions Column
          Delete action with Trash icon
          CAUTION: onClick directly calls onDelete(id) which modifies parent state
      ------------------------- */}
      <div
        onClick={handleDeleteClick}
        className="ml-30 flex items-center text-red-500 hover:text-red-400 cursor-pointer"
      >
        <Trash2 className="w-5 h-5" />
      </div>
    </div>
  );
};

export default BugRow;
