import React, { useState, useEffect, useRef } from "react";
import commentApi from "./comment";

// Helper: relative time (robust to null/invalid)
const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const diffInMinutes = Math.floor((now - date) / 1000 / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

// Simple markdown-like parser for bold and italic text.
const parseText = (text) => {
  if (!text) return "";
  let out = text;
  out = out.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return out;
};

// Read current user from localStorage
const getUserInfo = () => {
  try {
    const userInfoString = localStorage.getItem("userInfo");
    const parsedUserInfo = userInfoString ? JSON.parse(userInfoString) : {};
    return {
      id: parsedUserInfo._id || parsedUserInfo.id || parsedUserInfo.userId || null,
      name: parsedUserInfo.name || "Guest User",
      email: parsedUserInfo.email || "guest@example.com",
    };
  } catch (err) {
    console.warn("Error parsing user info:", err);
    return { id: null, name: "Guest User", email: "guest@example.com" };
  }
};

// Get team ID helper
const getTeamId = () => {
  try {
    const teamStr = localStorage.getItem("activeTeam");
    if (!teamStr) return null;
    const team = JSON.parse(teamStr);
    if (!team) return null;
    if (typeof team === "string") return team;
    return team._id || team.id || null;
  } catch (err) {
    console.warn("getTeamId parse error:", err);
    return null;
  }
};

// Visual helpers for avatars
const avatarColors = [
  ["#7C3AED", "#06B6D4"], ["#F59E0B", "#F97316"], ["#EF4444", "#EC4899"],
  ["#10B981", "#06B6D4"], ["#2563EB", "#7C3AED"], ["#F43F5E", "#FB923C"],
  ["#06B6D4", "#7DD3FC"], ["#8B5CF6", "#06B6D4"], ["#F97316", "#F43F5E"],
  ["#F472B6", "#E879F9"], ["#34D399", "#10B981"], ["#60A5FA", "#3B82F6"],
  ["#A78BFA", "#F472B6"], ["#FDE68A", "#FCA5A5"], ["#4ADE80", "#06B6D4"],
  ["#FB7185", "#F97316"], ["#06B6D4", "#818CF8"], ["#F59E0B", "#F472B6"],
  ["#84CC16", "#06B6D4"], ["#06B6D4", "#06B6D4"],
];

// Seeded pick with stable hashing
const pickGradient = (seed = "") => {
  let n = 5381;
  for (let i = 0; i < seed.length; i++) {
    n = (n * 33) ^ seed.charCodeAt(i);
  }
  const idx = Math.abs(n) % avatarColors.length;
  const [c1, c2] = avatarColors[idx];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

// Helper: truncate snippet
const snippet = (text, max = 80) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
};

// Inline notification helper
const showNotification = (message, type = "info") => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // You can enhance this with actual toast notifications if needed
};

// Reply Component for better organization
const ReplyItem = ({ 
  reply, 
  isCurrentUserReply, 
  onDelete, 
  onEdit, 
  loading,
  isEditing,
  editText,
  setEditText,
  onSaveEdit,
  onCancelEdit 
}) => {
  const replyAuthor = reply.author || {
    id: reply.createdBy?._id || reply.createdBy?.id || reply.createdBy,
    name: reply.createdBy?.name || "Unknown User",
    email: reply.createdBy?.email || ""
  };
  
  const replyInitials = replyAuthor.name ? replyAuthor.name.split(" ").map(n => n[0]).join("").toUpperCase() : "?";
  const replyGradient = pickGradient(replyAuthor.name || "unknown");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl transition-all duration-200 hover:bg-opacity-60"
      style={{ 
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      {/* Reply Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0"
        style={{ background: replyGradient }}
      >
        {replyInitials}
      </div>

      {/* Reply Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold text-white text-sm">
              {replyAuthor.name}
            </div>
            {replyAuthor.email && (
              <div className="text-xs text-gray-400 mt-0.5">
                {replyAuthor.email}
              </div>
            )}
          </div>
          {isCurrentUserReply && (
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={onEdit}
                  disabled={loading}
                  className="text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1 rounded-md hover:bg-blue-500/10 flex items-center gap-1"
                  title="Edit reply"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit
                </button>
              )}
              <button
                onClick={onDelete}
                disabled={loading}
                className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 rounded-md hover:bg-red-500/10 flex items-center gap-1"
                title="Delete reply"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "white",
                minHeight: "70px"
              }}
              placeholder="Edit your reply..."
              disabled={loading}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={onSaveEdit}
                disabled={loading || !editText.trim()}
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white text-xs rounded-md transition flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md transition flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
              <div className="text-xs text-gray-400 ml-2">
                Enter or Ctrl+Enter to save • Esc to cancel
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className="text-sm text-gray-200 mb-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseText(reply.text) }}
            />
            <div className="text-xs text-gray-500">
              {formatRelativeTime(reply.createdAt || reply.date)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Main CommentItem component
const CommentItem = ({
  comment,
  removeComment,
  removeReply,
  setReplyingTo,
  replyingTo,
  replyInput,
  setReplyInput,
  addReply,
  updateComment,
  currentUser,
}) => {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text || "");
  const [loading, setLoading] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  // Reply editing states
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState("");

  const commentId = comment._id || comment.id;
  const storedUser = getUserInfo();
  const isCurrentUserComment = 
    currentUser && 
    (currentUser.id === comment.author?.id || currentUser._id === comment.author?.id ||
     storedUser.id === comment.author?.id || storedUser.id === comment.createdBy?._id);

  // Load replies when showing them
  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    if (repliesLoaded && replies.length > 0) {
      setShowReplies(true);
      return;
    }

    setLoading(true);
    try {
      console.log("Loading replies for comment:", commentId);
      
      const response = await commentApi.getRepliesForComment({
        parentId: commentId,
      });
      
      console.log("Reply response:", response);
      
      if (response?.replies && Array.isArray(response.replies)) {
        const normalizedReplies = response.replies.map(r => ({
          ...r,
          id: r._id || r.id,
          author: {
            id: r.createdBy?._id || r.createdBy?.id || r.createdBy,
            name: r.createdBy?.name || "Unknown User",
            email: r.createdBy?.email || ""
          }
        }));
        console.log("Normalized replies:", normalizedReplies);
        setReplies(normalizedReplies);
        setRepliesLoaded(true);
        setShowReplies(true);
      } else {
        console.log("No replies found or invalid response format");
        setReplies([]);
        setRepliesLoaded(true);
        setShowReplies(true);
      }
    } catch (err) {
      console.error("Failed to load replies:", err);
      showNotification("Failed to load replies", "error");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced addReply function that updates local state immediately
  const handleAddReply = async () => {
    const text = (replyInput || "").trim();
    if (!text) return;

    const teamId = getTeamId();
    const bugId = comment.bugId || 
      JSON.parse(localStorage.getItem(`comments_${teamId}`) || "{}")._id;

    setLoading(true);
    try {
      console.log("Creating reply with:", { parentId: commentId, text, bugId, teamId });
      
      const savedReply = await commentApi.createReply({
        parentId: commentId,
        text,
        bugId,
        teamId,
      });

      console.log("Reply created:", savedReply);

      // Normalize the saved reply
      const normalizedReply = {
        ...savedReply,
        id: savedReply._id || savedReply.id,
        author: {
          id: savedReply.createdBy?._id || savedReply.createdBy?.id || savedReply.createdBy || storedUser.id,
          name: savedReply.createdBy?.name || storedUser.name,
          email: savedReply.createdBy?.email || storedUser.email
        }
      };

      // Update local replies state immediately
      setReplies(prev => [...prev, normalizedReply]);
      setShowReplies(true);
      setRepliesLoaded(true);
      
      // Call parent addReply for global state update
      if (addReply) {
        await addReply(commentId);
      }
      
      showNotification("Reply added successfully!", "success");
    } catch (err) {
      console.error("Failed to add reply:", err);
      showNotification("Failed to add reply. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save comment edit
  const saveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      await updateComment(commentId, trimmed);
      setIsEditing(false);
      showNotification("Comment updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update comment:", err);
      showNotification("Failed to update comment", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save reply edit
  const saveReplyEdit = async (replyId) => {
    const trimmed = editingReplyText.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      console.log("Updating reply:", { parentId: commentId, replyId, text: trimmed });
      
      await commentApi.updateReply({
        parentId: commentId,
        replyId,
        text: trimmed,
        teamId: getTeamId(),
      });

      // Update local reply state
      setReplies(prev => prev.map(r => 
        (r.id === replyId || r._id === replyId) 
          ? { ...r, text: trimmed }
          : r
      ));

      setEditingReplyId(null);
      setEditingReplyText("");
      showNotification("Reply updated successfully!", "success");
    } catch (err) {
      console.error("Failed to update reply:", err);
      showNotification("Failed to update reply", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancel comment edit
  const cancelEdit = () => {
    setEditText(comment.text || "");
    setIsEditing(false);
  };

  // Cancel reply edit
  const cancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditingReplyText("");
  };

  // Delete comment
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await removeComment(commentId);
      showNotification("Comment deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete comment:", err);
      showNotification("Failed to delete comment", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      console.log("Deleting reply:", { parentId: commentId, replyId });
      
      await commentApi.deleteReply({
        parentId: commentId,
        replyId,
        teamId: getTeamId(),
      });

      // Remove from local state immediately
      setReplies(prev => prev.filter(r => r.id !== replyId && r._id !== replyId));
      
      // Also call parent removeReply if available
      if (removeReply) {
        await removeReply(commentId, replyId);
      }
      
      showNotification("Reply deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete reply:", err);
      showNotification("Failed to delete reply", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard shortcuts in edit mode
  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  // Handle keyboard shortcuts in reply input
  const handleReplyKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddReply();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddReply();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setReplyingTo(null);
    }
  };

  // Extract author info with proper fallback
  const author = comment.author || {
    id: comment.createdBy?._id || comment.createdBy?.id || comment.createdBy,
    name: comment.createdBy?.name || "Unknown User",
    email: comment.createdBy?.email || ""
  };

  const authorInitials = author.name ? author.name.split(" ").map(n => n[0]).join("").toUpperCase() : "?";
  const authorGradient = pickGradient(author.name || "unknown");

  // Get reply count
  const replyCount = comment.repliesCount || replies.length || 0;

  return (
    <div
      className="w-full rounded-xl transition-all duration-200 hover:bg-opacity-60"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "20px",
      }}
    >
      {/* Comment Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Author Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0"
          style={{ background: authorGradient }}
        >
          {authorInitials}
        </div>

        {/* Author Info & Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white text-base">
                {author.name}
              </div>
              {author.email && (
                <div className="text-xs text-gray-400 mt-1">
                  {author.email}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(comment.createdAt || comment.date)}
              </div>
            </div>

            {/* Action Buttons */}
            {isCurrentUserComment && (
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    className="text-xs text-blue-400 hover:text-blue-300 transition px-3 py-1.5 rounded-md hover:bg-blue-500/10 flex items-center gap-1"
                    title="Edit comment"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-300 transition px-3 py-1.5 rounded-md hover:bg-red-500/10 flex items-center gap-1"
                  title="Delete comment"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Content */}
      <div className="ml-15">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full p-4 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "white",
                minHeight: "100px"
              }}
              placeholder="Edit your comment..."
              disabled={loading}
              autoFocus
            />
            <div className="flex items-center gap-3">
              <button
                onClick={saveEdit}
                disabled={loading || !editText.trim()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white text-sm rounded-md transition flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </button>
              <div className="text-xs text-gray-400 ml-2">
                Enter or Ctrl+Enter to save • Esc to cancel
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div
              className="text-sm text-gray-200 mb-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseText(comment.text) }}
            />

            {/* Reply Action */}
            <div className="flex items-center gap-6 mb-4">
              <button
                onClick={() => setReplyingTo(commentId)}
                className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-500/10"
                title="Reply to comment"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Reply
              </button>

              {replyCount > 0 && (
                <button
                  onClick={loadReplies}
                  disabled={loading}
                  className="text-sm text-gray-400 hover:text-gray-300 transition flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-500/10"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      {showReplies ? "Hide replies" : `Show ${replyCount} replies`}
                      <svg className={`w-4 h-4 transition-transform ${showReplies ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reply Input */}
        {replyingTo === commentId && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
            <textarea
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={handleReplyKeyDown}
              className="w-full p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                minHeight: "80px"
              }}
              placeholder="Write a reply..."
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-400">
                Enter to send • Esc to cancel
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddReply}
                  disabled={!replyInput.trim() || loading}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white text-sm rounded-md transition"
                >
                  {loading ? "Sending..." : "Reply"}
                </button>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {showReplies && (
          <div className="space-y-3 pl-6 border-l-2 border-purple-500/30">
            {replies.length > 0 ? (
              replies.map((reply) => {
                const isCurrentUserReply = 
                  storedUser.id === reply.author?.id || 
                  storedUser.id === reply.createdBy?._id ||
                  (currentUser && (
                    currentUser.id === reply.author?.id || 
                    currentUser._id === reply.author?.id ||
                    currentUser.id === reply.createdBy?._id ||
                    currentUser._id === reply.createdBy?._id
                  ));

                return (
                  <ReplyItem
                    key={reply.id || reply._id}
                    reply={reply}
                    isCurrentUserReply={isCurrentUserReply}
                    onDelete={() => handleDeleteReply(reply.id || reply._id)}
                    onEdit={() => {
                      setEditingReplyId(reply.id || reply._id);
                      setEditingReplyText(reply.text || "");
                    }}
                    loading={loading}
                    isEditing={editingReplyId === (reply.id || reply._id)}
                    editText={editingReplyText}
                    setEditText={setEditingReplyText}
                    onSaveEdit={() => saveReplyEdit(reply.id || reply._id)}
                    onCancelEdit={cancelReplyEdit}
                  />
                );
              })
            ) : (
              <div className="text-sm text-gray-500 italic p-4">
                No replies yet. Be the first to reply!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;