import React, { useState, useEffect, useRef } from "react";
import commentApi from "./comment"; // make sure this path matches your project

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
// NOTE: using dangerouslySetInnerHTML — ensure server-side sanitization
const parseText = (text) => {
  if (!text) return "";
  let out = text;
  out = out.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return out;
};

// Read current user from localStorage (keep this, but expose id as well)
const userInfoString = localStorage.getItem("userInfo");
const parsedUserInfo = userInfoString ? JSON.parse(userInfoString) : {};
const storedUser = {
  id: parsedUserInfo._id || parsedUserInfo.id || parsedUserInfo.userId || null,
  name: parsedUserInfo.name || "Guest User",
  email: parsedUserInfo.email || "guest@example.com",
};

// Visual helpers (UI-only)
const avatarColors = [
  ["#7C3AED", "#06B6D4"],
  ["#F59E0B", "#F97316"],
  ["#EF4444", "#EC4899"],
  ["#10B981", "#06B6D4"],
  ["#2563EB", "#7C3AED"],
  ["#F43F5E", "#FB923C"],
  ["#06B6D4", "#7DD3FC"],
  ["#8B5CF6", "#06B6D4"],
  ["#F97316", "#F43F5E"],
  ["#F472B6", "#E879F9"],
  ["#34D399", "#10B981"],
  ["#60A5FA", "#3B82F6"],
  ["#A78BFA", "#F472B6"],
  ["#FDE68A", "#FCA5A5"],
  ["#4ADE80", "#06B6D4"],
  ["#FB7185", "#F97316"],
  ["#06B6D4", "#818CF8"],
  ["#F59E0B", "#F472B6"],
  ["#84CC16", "#06B6D4"],
  ["#06B6D4", "#06B6D4"],
];

// seeded pick with stable hashing
const pickGradient = (seed = "") => {
  let n = 5381;
  for (let i = 0; i < seed.length; i++) {
    n = (n * 33) ^ seed.charCodeAt(i);
  }
  const idx = Math.abs(n) % avatarColors.length;
  const [c1, c2] = avatarColors[idx];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

// helper: truncate snippet
const snippet = (text, max = 80) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
};

// Toast component (stacked + queued behavior)
const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION = 4500; // ms (undo window for deletes)

const Toasts = ({ list, removeToast, onUndo }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {list.map((t) => (
        <div
          key={t.id}
          style={{
            minWidth: 220,
            maxWidth: 420,
            background: "rgba(20,20,25,0.96)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "white",
            padding: "10px 12px",
            borderRadius: 10,
            boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#fff",
                fontSize: 14,
              }}
            >
              {t.title?.[0] || "I"}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                {t.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.78)",
                  marginBottom: 6,
                }}
              >
                {t.message}
              </div>
              {t.snippet && (
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    fontStyle: "italic",
                  }}
                >
                  {t.snippet}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {t.canUndo && (
              <button
                onClick={() => onUndo(t.id)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Undo
              </button>
            )}
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                fontSize: 16,
              }}
              aria-label="close"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Utility: check if a string looks like a Mongo ObjectId (best-effort)
const looksLikeObjectId = (s) =>
  typeof s === "string" && /^[a-f0-9]{24}$/.test(s);

// Resolve author-like fields to a friendly name using storedUser as a fallback
const resolveAuthorFieldToName = (field) => {
  if (!field) return null;
  if (typeof field === "object")
    return field.name || field.email || field._id || null;
  if (typeof field === "string") {
    // if backend returned an id for the current user, prefer name from localStorage
    if (storedUser.id && field === storedUser.id) return storedUser.name;
    if (storedUser.email && field === storedUser.email) return storedUser.name;
    // if it's a normal user-display-name string, return it as-is
    return field;
  }
  return null;
};

const CommentItem = ({
  comment,
  removeComment, // function(commentId) -> parent should remove comment from list
  removeReply, // function(parentId, replyId) -> parent should remove reply from parent comment
  setReplyingTo,
  replyingTo,
  replyInput,
  setReplyInput,
  addReply, // function(parentId, optionalReplyObjectOrText) -> parent to add reply (used for undo fallback)
  updateComment,
  currentUser, // parent may still pass this
}) => {
  const isReply = !!comment?.parentId;

  // derive a robust author name (support different shapes). Use storedUser as fallback when an id is present.
  const authorName =
    resolveAuthorFieldToName(comment?.author) ||
    resolveAuthorFieldToName(comment?.createdBy) ||
    resolveAuthorFieldToName(comment?.user) ||
    "Unknown";

  const avatarText = (authorName || "User")[0].toUpperCase();

  // Initially hide replies
  const [isRepliesCollapsed, setIsRepliesCollapsed] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.text || "");
  const replyInputRef = useRef(null);

  // fetched replies state + loading; null = not loaded yet
  const [fetchedReplies, setFetchedReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Toasts + pending delete timers
  const [toasts, setToasts] = useState([]);
  const pendingDeletesRef = useRef({}); // key -> { timerId, data }

  // focus the inline reply input when replyingTo changes to this comment
  useEffect(() => {
    if (replyingTo === (comment?.id || comment?._id) && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo, comment]);

  useEffect(() => {
    setEditText(comment?.text || "");
  }, [comment?.text]);

  const handleEditToggle = () => {
    const currentName = currentUser?.name || storedUser.name;
    if (authorName !== currentName) {
      return;
    }
    if (isEditing) {
      // save
      updateComment &&
        updateComment(comment.id || comment._id || comment.id, editText);

      setIsEditing(false);

      // If this is a reply, call backend update for reply (fire-and-forget)
      if (isReply) {
        (async () => {
          try {
            if (typeof commentApi.updateReply === "function") {
              await commentApi.updateReply({
                parentId: comment.parentId,
                replyId: comment.id || comment._id,
                text: editText,
              });
            }
          } catch (err) {
            console.error("Error updating reply on backend:", err);
          }
        })();
      } else {
        // top-level comment update (if API has updateComment)
        (async () => {
          try {
            if (typeof commentApi.updateComment === "function") {
              await commentApi.updateComment({
                commentId: comment.id || comment._id,
                text: editText,
              });
            }
          } catch (err) {
            console.error("Error updating comment on backend:", err);
          }
        })();
      }
    } else {
      setIsEditing(true);
      setEditText(comment?.text || "");
    }
  };

  // helper: normalize server reply payloads into an array of reply objects
  const normalizeReplyPayload = (raw) => {
    let data = raw;
    if (!data) return [];
    if (typeof data === "object" && "data" in data) data = data.data;

    if (Array.isArray(data)) return data;
    if (data?.replies && Array.isArray(data.replies)) return data.replies;
    if (data?.reply && Array.isArray(data.reply)) return data.reply;

    if (typeof data === "object" && (data.text || data._id || data.id))
      return [data];

    return [];
  };

  // fetchReplies function (called on expand)
  const fetchReplies = async () => {
    if (isReply) return;
    if (fetchedReplies !== null) return;

    // Resolve bugId to pass to the API
    let bugIdToSend =
      comment?.bugId ||
      (comment?.bug && (typeof comment.bug === "string" ? comment.bug : comment.bug._id)) ||
      null;

    if (!bugIdToSend) {
      try {
        const sel = JSON.parse(localStorage.getItem("selectedBug") || "{}");
        bugIdToSend = sel._id || sel.id || null;
      } catch (e) {
        bugIdToSend = null;
      }
    }

    try {
      setLoadingReplies(true);
      if (typeof commentApi.getReplyToComment !== "function") {
        setFetchedReplies([]);
        return;
      }
      const res = await commentApi.getReplyToComment({
        parentId: comment.id || comment._id,
        bugId: bugIdToSend,
      });

      const rawList = normalizeReplyPayload(res);
      const normalized = rawList.map((r) => {
        const rid = r.id || r._id || `${Date.now()}_${Math.random()}`;
        const rAuthor =
          resolveAuthorFieldToName(r.author) ||
          resolveAuthorFieldToName(r.createdBy) ||
          resolveAuthorFieldToName(r.user) ||
          "Unknown";
        const rDate = r.createdAt || r.date || r.updatedAt || null;

        return {
          ...r,
          id: rid,
          _id: r._id || rid,
          author: rAuthor,
          date: rDate,
        };
      });

      setFetchedReplies(normalized);
    } catch (err) {
      console.error("Error fetching replies:", err);
      setFetchedReplies([]); // prevent infinite loading
    } finally {
      setLoadingReplies(false);
    }
  };

  // toggleReplies toggles collapse; when expanding, fetch if needed
  const toggleReplies = async () => {
    if (isRepliesCollapsed) {
      await fetchReplies();
      setIsRepliesCollapsed(false);
    } else {
      setIsRepliesCollapsed(true);
    }
  };

  // Merge / reconcile new replies passed through comment.replies (if parent updates them)
  useEffect(() => {
    const incoming = Array.isArray(comment?.replies) ? comment.replies : [];
    if (incoming.length === 0) {
      setFetchedReplies((prev) => {
        if (prev === null) return null;
        return [];
      });
      return;
    }

    const normalizedIncoming = incoming.map((r) => {
      const rid = r.id || r._id || `${Date.now()}_${Math.random()}`;
      const rAuthor =
        resolveAuthorFieldToName(r.author) ||
        resolveAuthorFieldToName(r.createdBy) ||
        "Unknown";
      const rDate = r.createdAt || r.date || r.updatedAt || null;
      return { ...r, id: rid, _id: r._id || rid, author: rAuthor, date: rDate };
    });

    setFetchedReplies((prev) => {
      if (prev === null) {
        return normalizedIncoming;
      }

      // Reconcile: keep prev items present in incoming, then append new incoming
      const incomingIds = new Set(normalizedIncoming.map((x) => String(x.id)));
      const kept = prev.filter((p) => incomingIds.has(String(p.id)));
      const keptIds = new Set(kept.map((p) => String(p.id)));
      for (const inc of normalizedIncoming) {
        if (!keptIds.has(String(inc.id))) kept.push(inc);
      }
      return kept;
    });
  }, [comment?.replies]);

  // Choose which replies to render: prefer fetchedReplies when loaded, else fallback
  const repliesToRender =
    fetchedReplies !== null
      ? fetchedReplies
      : Array.isArray(comment?.replies)
      ? comment.replies
      : [];

  // total replies count (shows even when collapsed)
  const totalRepliesCount =
    (comment?.replies && comment.replies.length) ??
    (fetchedReplies ? fetchedReplies.length : 0);

  // Determine date to display robustly (support createdAt or date)
  const displayedDate = comment?.createdAt || comment?.date || comment?.updatedAt;

  // ---------- Deletion + Undo logic ----------

  // helper to push a new toast
  const pushToast = (toast) => {
    setToasts((t) => {
      const next = [toast, ...t].slice(0, MAX_VISIBLE_TOASTS);
      return next;
    });
  };

  const removeToastById = (id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  // Reply deletion
  const handleDeleteReply = async (parentId, replyObj) => {
    const targetId = replyObj.id || replyObj._id || null;
    if (!targetId) return console.warn("No id found on replyObj", replyObj);

    const targetKey = String(targetId);

    // Optimistically remove from local state immediately
    setFetchedReplies((prev) =>
      prev ? prev.filter((r) => String(r.id || r._id || "") !== targetKey) : prev
    );

    // Also tell parent to remove it from its canonical state
    if (typeof removeReply === "function") {
      try {
        removeReply(parentId, targetId, replyObj);
      } catch (err) {
        try {
          removeReply(parentId, targetId);
        } catch (e) {
          console.warn("parent removeReply failed:", e);
        }
      }
    }

    const toastId = `del_reply_${Date.now()}_${Math.random()}`;
    const title = `${storedUser.name} deleted reply`;
    const message = `A reply was deleted`;
    const s = snippet(replyObj.text || replyObj.body || replyObj.message || "", 120);

    pushToast({
      id: toastId,
      title,
      message,
      snippet: s,
      canUndo: false,
    });

    try {
      // Delete the reply on backend
      if (typeof commentApi.deleteReply === "function") {
        await commentApi.deleteReply({ parentId, replyId: targetId });
      }

      // After successful deletion, fetch fresh replies for this parent comment (best-effort)
      let bugIdToSend = null;
      try {
        const sel = JSON.parse(localStorage.getItem("selectedBug") || "{}");
        bugIdToSend = sel._id || sel.id || null;
      } catch (e) {
        bugIdToSend = null;
      }

      if (typeof commentApi.getReplyToComment === "function") {
        const res = await commentApi.getReplyToComment({
          parentId,
          bugId: bugIdToSend,
        });
        const rawList = Array.isArray(res) ? res : res.data || res.replies || [];
        const normalized = rawList.map((r) => ({
          ...r,
          id: r.id || r._id || `${Date.now()}_${Math.random()}`,
          _id: r._id || r.id || `${Date.now()}_${Math.random()}`,
          author:
            resolveAuthorFieldToName(r.author) ||
            resolveAuthorFieldToName(r.createdBy) ||
            resolveAuthorFieldToName(r.user) ||
            "Unknown",
          date: r.createdAt || r.date || new Date().toISOString(),
        }));

        setFetchedReplies(normalized);
      }

      pushToast({
        id: `${toastId}_confirm`,
        title: "Deletion confirmed",
        message: `Reply permanently deleted and updated`,
        snippet: s,
        canUndo: false,
      });
    } catch (err) {
      console.error("Delete or fetch failed:", err);

      pushToast({
        id: `${toastId}_err`,
        title: "Delete failed",
        message: "Could not delete reply or fetch fresh replies from server.",
        snippet: s,
        canUndo: false,
      });
    } finally {
      delete pendingDeletesRef.current[toastId];
      removeToastById(toastId);
    }
  };

  // Undo handler for reply deletion (kept for compatibility but replies are no-undo now)
  const handleUndo = async (toastId) => {
    const pending = pendingDeletesRef.current[toastId];
    if (!pending) {
      removeToastById(toastId);
      return;
    }

    clearTimeout(pending.timerId);
    const { type, data: replyObj, parentId } = pending;

    let restored = null;
    try {
      if (type === "reply") {
        if (typeof commentApi.createReply === "function") {
          const createRes = await commentApi.createReply({
            parentId,
            text: replyObj.text || replyObj.body || "",
          });
          const created = (createRes && (createRes.data || createRes)) || null;
          if (created) {
            restored = {
              id: created.id || created._id || `${Date.now()}_${Math.random()}`,
              ...created,
              author: replyObj.author || storedUser.name,
              date: created.createdAt || new Date().toISOString(),
            };
          }
        }
      }
    } catch (err) {
      console.warn("Backend restore failed (createReply)", err);
      restored = null;
    }

    if (!restored) {
      if (typeof addReply === "function") {
        try {
          try {
            addReply(parentId, replyObj);
            restored = replyObj;
          } catch (e) {
            addReply(parentId, replyObj.text || replyObj.body || "");
            restored = replyObj;
          }
        } catch (e) {
          console.warn("addReply fallback failed", e);
        }
      } else {
        setFetchedReplies((prev) => {
          const r = {
            ...replyObj,
            id: replyObj.id || `${Date.now()}_${Math.random()}`,
            author: replyObj.author || storedUser.name,
            date: replyObj.date || new Date().toISOString(),
          };
          if (prev === null) return [r];
          return [r, ...prev];
        });
        restored = replyObj;
      }
    } else {
      setFetchedReplies((prev) => {
        if (prev === null) return [restored];
        if (prev.some((p) => String(p.id) === String(restored.id))) return prev;
        return [restored, ...prev];
      });
    }

    delete pendingDeletesRef.current[toastId];
    removeToastById(toastId);

    pushToast({
      id: `${toastId}_restored_${Date.now()}`,
      title: "Restored",
      message: `${storedUser.name} restored a reply`,
      snippet: snippet(restored?.text || restored?.body || "", 120),
      canUndo: false,
    });
  };

  // When deleting a top-level comment: immediate remove, show toast (no undo), delay backend delete
  const handleDeleteComment = (commentObj) => {
    const commentId = commentObj.id || commentObj._id;
    if (!commentId) {
      console.warn("No id on comment to delete", commentObj);
      return;
    }

    // remove from UI immediately
    if (typeof removeComment === "function") removeComment(commentId);

    const toastId = `del_comment_${Date.now()}_${Math.random()}`;
    const title = `${storedUser.name} deleted comment`;
    const message = `A comment was deleted`;
    const s = snippet(commentObj.text || commentObj.body || "", 140);

    // schedule backend delete after TOAST_DURATION
    const timerId = setTimeout(async () => {
      try {
        if (typeof commentApi.deleteComment === "function") {
          await commentApi.deleteComment({ commentId });
        }
        pushToast({
          id: `${toastId}_confirm`,
          title: "Deletion confirmed",
          message: `Comment permanently deleted`,
          snippet: s,
          canUndo: false,
        });
      } catch (err) {
        console.error("Error deleting comment on backend:", err);
        pushToast({
          id: `${toastId}_err`,
          title: "Delete failed",
          message: "Could not delete comment on server.",
          snippet: s,
          canUndo: false,
        });
      } finally {
        delete pendingDeletesRef.current[toastId];
        removeToastById(toastId);
      }
    }, TOAST_DURATION);

    pendingDeletesRef.current[toastId] = {
      timerId,
      type: "comment",
      data: commentObj,
    };

    pushToast({
      id: toastId,
      title,
      message,
      snippet: s,
      canUndo: false,
    });
  };

  // Exposed handler when user clicks the delete button in UI
  const onDeleteClick = () => {
    if (isReply) {
      handleDeleteReply(comment.parentId, comment);
    } else {
      handleDeleteComment(comment);
    }
  };

  return (
    <>
      <div
        className={`transition-transform duration-150 ${isReply ? "ml-6" : ""}`}
        style={{
          border: "1px solid var(--border)",
          background: "var(--surface)",
          borderRadius: 12,
        }}
      >
        <div className="p-3 flex gap-3 items-start">
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
              style={{
                background: pickGradient(authorName || "u"),
                color: "white",
                boxShadow: "0 6px 18px rgba(0,0,0,0.55)",
              }}
            >
              {avatarText}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div style={{ overflow: "hidden" }}>
                <div className="flex items-center gap-2">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {authorName}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatRelativeTime(displayedDate)}
                  </div>
                  {comment?.role && (
                    <div
                      className="text-xs px-2 py-[2px] rounded"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        color: "var(--muted)",
                        marginLeft: 6,
                      }}
                    >
                      {comment.role}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-2 text-sm"
                style={{ whiteSpace: "nowrap" }}
              >
                {/* Reply opens inline reply input */}
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(comment.id || comment._id)}
                    className="px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.02)] transition"
                    style={{ color: "var(--muted)" }}
                  >
                    Reply
                  </button>
                )}

                {(authorName === (currentUser?.name || storedUser.name)) && (
                  <button
                    onClick={handleEditToggle}
                    className="px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.02)] transition"
                    style={{ color: "var(--muted)" }}
                  >
                    {isEditing ? "Save" : "Edit"}
                  </button>
                )}

                <button
                  onClick={onDeleteClick}
                  className="px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.02)] transition"
                  title="Delete"
                  style={{ color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="mt-3 w-full text-sm rounded-md px-3 py-2"
                rows={3}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
                }}
              />
            ) : (
              <div
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--text)" }}
                dangerouslySetInnerHTML={{
                  __html: parseText(comment?.text || ""),
                }}
              />
            )}

            {/* Replies toggle & list */}
            {!isReply && (
              <div className="mt-3">
                {/* Show reply count + toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleReplies}
                    className="text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {isRepliesCollapsed
                      ? `Show replies (${totalRepliesCount})`
                      : `Hide replies (${totalRepliesCount})`}
                  </button>
                  {loadingReplies && (
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      Loading…
                    </div>
                  )}
                </div>

                {/* List (only when expanded and not loading) */}
                {!isRepliesCollapsed && (
                  <div className="mt-3 space-y-3">
                    {!loadingReplies && repliesToRender?.length > 0
                      ? repliesToRender.map((r) => (
                          <CommentItem
                            key={r.id || r._id}
                            comment={{ ...r, parentId: comment.id || comment._id }}
                            removeComment={removeComment}
                            removeReply={(parentId, replyId) => {
                              if (typeof removeReply === "function")
                                removeReply(parentId, replyId);
                            }}
                            setReplyingTo={setReplyingTo}
                            replyingTo={replyingTo}
                            replyInput={replyInput}
                            setReplyInput={setReplyInput}
                            addReply={addReply}
                            updateComment={updateComment}
                            currentUser={currentUser}
                          />
                        ))
                      : null}

                    {!loadingReplies && repliesToRender?.length === 0 && (
                      <div className="text-xs text-gray-500">No replies yet</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Inline reply input */}
            {!isReply && replyingTo === (comment.id || comment._id) && (
              <div className="mt-3 flex gap-2 items-start">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyInput || ""}
                  onChange={(e) => setReplyInput && setReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addReply && addReply(comment.id || comment._id);
                    }
                  }}
                  placeholder="Write a reply..."
                  className="flex-1 text-sm rounded-full px-4 py-2 outline-none"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
                  }}
                />
                <button
                  onClick={() => addReply && addReply(comment.id || comment._id)}
                  className="rounded-full px-3 py-1 text-sm transition"
                  style={{
                    background: "linear-gradient(90deg,var(--accent), #4F46E5)",
                    color: "white",
                    boxShadow: "0 6px 16px rgba(79,70,229,0.18)",
                  }}
                >
                  Reply
                </button>
                <button
                  onClick={() => setReplyingTo && setReplyingTo(null)}
                  className="px-2 py-1 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts UI for this item (local). In a bigger app you'd hoist this to a single provider. */}
      <Toasts
        list={toasts}
        removeToast={(id) => {
          removeToastById(id);
        }}
        onUndo={handleUndo}
      />
    </>
  );
};

export default CommentItem;
