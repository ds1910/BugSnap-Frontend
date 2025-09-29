import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import commentApi from "./comment";
import CommentItem from "./CommentItem";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Toast component (stacked + queued behavior)
const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION = 3000; // ms (reduced undo window per request)

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
            maxWidth: 380,
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

// Small dropdown (unchanged visuals)
const CustomDropdown = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-[10px] px-3 py-1 text-sm transition"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--muted)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.01)",
        }}
      >
        {selected.label}
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-36 rounded-md shadow-lg z-30"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  background:
                    opt.value === value ? "var(--accent)" : "transparent",
                  color: opt.value === value ? "white" : "var(--muted)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: create a short snippet
const snippet = (text = "", len = 120) => {
  const s = String(text || "");
  if (s.length <= len) return s;
  return s.slice(0, len - 1).trim() + "…";
};

// Normalize comments & replies so every item has both `id` and `_id` and they match.
const normalizeComments = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((c) => {
    const normalizedReplies = Array.isArray(c.replies)
      ? c.replies.map((r) => {
          const rid = r.id || r._id || `${Date.now()}_${Math.random()}`;
          return { ...r, id: rid, _id: r._id || rid };
        })
      : [];
    const cid = c.id || c._id || `${Date.now()}_${Math.random()}`;
    return {
      ...c,
      id: cid,
      _id: c._id || cid,
      replies: normalizedReplies,
    };
  });
};

const generateId = () =>
  Date.now() + "_" + Math.random().toString(36).slice(2, 9);

// Main Comments component
const Comments = ({ bug = {}, updateBug = null }) => {
  // Parse current user at render-time so latest userInfo is respected
  const userInfoString = localStorage.getItem("userInfo");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : {};
  const currentUser = {
    name: userInfo.name || "Guest User",
    email: userInfo.email || "guest@example.com",
    id: userInfo.id || userInfo._id || null,
  };

  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyInput, setReplyInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvancedInput, setShowAdvancedInput] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Toasts & queue state
  const [visibleToasts, _setVisibleToasts] = useState([]); // displayed
  const visibleToastsRef = useRef([]);
  const toastQueueRef = useRef([]); // queued toasts
  const pendingDeletionsRef = useRef({}); // pendingId -> { timeoutId, data }

  // Refs & keys
  const commentsRef = useRef([]);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const searchRef = useRef(null);
  const bugKey = "selectedBug";

  // Utility to get current teamId (from bug prop or cached selectedBug)
  const getTeamId = useCallback(() => {
    if (bug && (bug.teamId || bug.team)) return bug.teamId || bug.team;
    try {
      const stored = JSON.parse(localStorage.getItem(bugKey) || "{}");
      return stored.teamId || stored.team || null;
    } catch (e) {
      return null;
    }
  }, [bug]);

  // Remove any visible or queued toast that references this pendingId
  const cleanupToastByPendingId = useCallback(
    (pendingId) => {
      try {
        const vt = visibleToastsRef.current || [];
        const inVisible = vt.find((t) => t.meta?.pendingId === pendingId);
        if (inVisible) {
          // removeToast will clear timers and may show queued toasts
          removeToast(inVisible.id);
          return;
        }
        // If it's in the queue, remove it from queue
        const q = toastQueueRef.current || [];
        const qi = q.findIndex((t) => t.meta?.pendingId === pendingId);
        if (qi !== -1) {
          q.splice(qi, 1);
          toastQueueRef.current = q;
        }
      } catch (err) {
        console.error("cleanupToastByPendingId error:", err);
      }
    },
    // note: removeToast is declared later; we'll not include it here to avoid cyclic deps - safe because function identity stable in this file scope
    []
  );

  // keep refs in sync with state helpers
  const setCommentsAndRef = (next) => {
    if (typeof next === "function") {
      setComments((prev) => {
        const resolved = next(prev);
        commentsRef.current = resolved;
        return resolved;
      });
    } else {
      commentsRef.current = next;
      setComments(next);
    }
  };

  const setVisibleToastsAndRef = (next) => {
    if (typeof next === "function") {
      _setVisibleToasts((prev) => {
        const resolved = next(prev);
        visibleToastsRef.current = resolved;
        return resolved;
      });
    } else {
      visibleToastsRef.current = next;
      _setVisibleToasts(next);
    }
  };

  const EMOJIS = [
    "👍",
    "🎉",
    "🐛",
    "✅",
    "❌",
    "🤔",
    "🔥",
    "😅",
    "🧪",
    "📝",
    "💡",
    "🚀",
  ];

  useEffect(() => {
    const loadComments = async () => {
      try {
        const bugData = JSON.parse(localStorage.getItem(bugKey) || "{}");

        if (!bugData?._id && !bug._id) {
          setCommentsAndRef([]);
          return;
        }

        // Step 1: load cached comments
        const cached = Array.isArray(bugData.comments) ? bugData.comments : [];
        const normalizedCached = normalizeComments(cached);
        setCommentsAndRef(normalizedCached);

        // Step 2: fetch fresh comments from backend if we have an id
        const bugId = bug._id || bugData._id;

        if (bugId) {
          const freshComments = await commentApi.getCommentsForBug({
            bugId,
          });

          if (Array.isArray(freshComments) && freshComments.length > 0) {
            const normalized = normalizeComments(freshComments);
            setCommentsAndRef(normalized);

            // Optionally sync to localStorage too
            localStorage.setItem(
              bugKey,
              JSON.stringify({ ...bugData, _id: bugId, comments: normalized })
            );
          }
        }
      } catch (e) {
        console.error("Failed to load comments:", e);
        setCommentsAndRef([]);
      }
    };

    loadComments();
  }, [bug?._id]);

  const updateLocalStorage = useCallback((updatedComments) => {
    try {
      const normalized = normalizeComments(updatedComments);
      const bugData = JSON.parse(localStorage.getItem(bugKey) || "{}");
      bugData.comments = normalized;
      localStorage.setItem(bugKey, JSON.stringify(bugData));
      setCommentsAndRef(normalized);
    } catch (e) {
      console.error("Failed to update local storage:", e);
    }
  }, []);

  // TOAST + QUEUE helpers
  const removeToast = useCallback(
    (id) => {
      setVisibleToastsAndRef((prev) => {
        const toastToRemove = prev.find((t) => t.id === id);
        if (toastToRemove && toastToRemove._timer) {
          clearTimeout(toastToRemove._timer);
        }

        const next = prev.filter((p) => p.id !== id);

        if (
          toastQueueRef.current.length > 0 &&
          next.length < MAX_VISIBLE_TOASTS
        ) {
          const queued = toastQueueRef.current.shift();
          const timer = setTimeout(() => {
            // call removeToast when this queued toast times out
            removeToast(queued.id);
          }, TOAST_DURATION);
          queued._timer = timer;
          return [...next, queued];
        }
        return next;
      });
    },
    [setVisibleToastsAndRef]
  );

  const pushToast = useCallback(
    (toast) => {
      const id = Date.now() + Math.random();
      const t = { id, ...toast };

      setVisibleToastsAndRef((prev) => {
        if (prev.length < MAX_VISIBLE_TOASTS) {
          const timer = setTimeout(() => {
            removeToast(id);
          }, TOAST_DURATION);
          t._timer = timer;
          return [...prev, t];
        } else {
          toastQueueRef.current.push(t);
          return prev;
        }
      });
      return id;
    },
    [removeToast, setVisibleToastsAndRef]
  );

  const handleUndo = useCallback(
    (toastId) => {
      const t =
        visibleToastsRef.current.find((x) => x.id === toastId) ||
        toastQueueRef.current.find((x) => x.id === toastId);
      if (!t) return;

      const pendId = t.meta?.pendingId;
      if (pendId && pendingDeletionsRef.current[pendId]) {
        const pend = pendingDeletionsRef.current[pendId];
        clearTimeout(pend.timeoutId);

        if (pend.type === "comment") {
          const restored = [...commentsRef.current];
          const idx = Math.min(Math.max(0, pend.index), restored.length);
          restored.splice(idx, 0, pend.item);
          updateLocalStorage(restored);
        } else if (pend.type === "reply") {
          const restored = commentsRef.current.map((c) => {
            if (c.id === pend.parentId) {
              const replies = Array.isArray(c.replies) ? [...c.replies] : [];
              const idx = Math.min(Math.max(0, pend.index), replies.length);
              replies.splice(idx, 0, pend.item);
              return { ...c, replies };
            }
            return c;
          });
          updateLocalStorage(restored);
        }
        delete pendingDeletionsRef.current[pendId];
      }

      removeToast(toastId);
    },
    [updateLocalStorage, removeToast]
  );

  // Helper to remove a reply directly from state + localStorage (ensures consistent removal)
  const removeReplyFromState = useCallback(
    (parentId, replyId) => {
      try {
        const cur = commentsRef.current || [];
        const updated = cur.map((c) => {
          if (c.id === parentId) {
            const filteredReplies = (c.replies || []).filter((r) => {
              const rid = String(r.id || r._id || "");
              const target = String(replyId || "");
              return rid !== target;
            });
            return { ...c, replies: filteredReplies };
          }
          return c;
        });
        updateLocalStorage(updated);
      } catch (err) {
        console.error("removeReplyFromState error:", err);
      }
    },
    [updateLocalStorage]
  );

  // SCHEDULE deletion with undo capability (parent comment)
  const scheduleCommentDeletion = useCallback(
    (commentId) => {
      const curComments = commentsRef.current || [];
      const idx = curComments.findIndex((c) => c.id === commentId);
      if (idx === -1) return;
      const removed = JSON.parse(JSON.stringify(curComments[idx])); // snapshot

      // Optimistic removal from UI & storage
      const updated = curComments.filter((c) => c.id !== commentId);
      updateLocalStorage(updated);

      const teamId = getTeamId();

      const pendingId = generateId();
      const timeoutId = setTimeout(async () => {
        try {
          // Perform backend delete. teamId may be null.
          await commentApi.deleteComment({ commentId, teamId });

          // Deletion succeeded -> ensure it's removed in state (defensive)
          const stillThere = (commentsRef.current || []).some(
            (c) => c.id === commentId
          );
          if (stillThere) {
            const after = (commentsRef.current || []).filter(
              (c) => c.id !== commentId
            );
            updateLocalStorage(after);
          }

          delete pendingDeletionsRef.current[pendingId];
          cleanupToastByPendingId(pendingId);

          // Show final confirmation message with actor + snippet
          pushToast({
            title: currentUser.name,
            message: "deleted a comment",
            snippet: snippet(removed.text, 120),
            canUndo: false,
          });
        } catch (err) {
          console.error("❌ Failed to delete comment from backend:", err);

          // Restore the comment in UI/storage
          const restored = [...commentsRef.current];
          const safeIdx = Math.min(Math.max(0, idx), restored.length);
          restored.splice(safeIdx, 0, removed);
          updateLocalStorage(restored);

          pushToast({
            title: "Error",
            message: `Could not delete comment by ${
              removed.author || "someone"
            }`,
            canUndo: false,
          });

          delete pendingDeletionsRef.current[pendingId];
          cleanupToastByPendingId(pendingId);
        }
      }, TOAST_DURATION);

      pendingDeletionsRef.current[pendingId] = {
        type: "comment",
        item: removed,
        index: idx,
        timeoutId,
      };

      // initial undoable toast
      pushToast({
        title: currentUser.name,
        message: `Removed a comment by ${removed.author?.name || "someone"}`,
        snippet: snippet(removed.text, 120),
        canUndo: true,
        meta: { pendingId },
      });
    },
    [updateLocalStorage, pushToast, getTeamId, cleanupToastByPendingId]
  );

  // SCHEDULE deletion with undo capability (reply)
  const scheduleReplyDeletion = useCallback(
    (parentId, replyId) => {
      const curComments = commentsRef.current || [];
      const parent = curComments.find((c) => c.id === parentId);
      if (!parent) {
        console.warn("scheduleReplyDeletion: parent not found", parentId);
        return;
      }
      const replies = Array.isArray(parent.replies) ? parent.replies : [];
      // robust id match (by id or _id) and string compare
      const idx = replies.findIndex((r) => {
        const rid = String(r.id || r._id || "");
        const target = String(replyId || "");
        return rid === target;
      });
      if (idx === -1) {
        console.warn("scheduleReplyDeletion: reply not found", replyId);
        return;
      }

      const removed = JSON.parse(JSON.stringify(replies[idx])); // snapshot for undo

      // Optimistically update UI (hide reply immediately) - filter both id and _id
      const updated = curComments.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: (c.replies || []).filter((r) => {
                const rid = String(r.id || r._id || "");
                const target = String(replyId || "");
                return rid !== target;
              }),
            }
          : c
      );
      updateLocalStorage(updated);

      const pendingId = generateId();
      const teamId = getTeamId();
      const timeoutId = setTimeout(async () => {
        try {
          // pass teamId as requested
          await commentApi.deleteReply({ parentId, replyId, teamId });

          // deletion succeeded -> remove the pending and the undo toast
          delete pendingDeletionsRef.current[pendingId];
          cleanupToastByPendingId(pendingId);

          // Defensive ensure reply is removed (fixes occasional re-appear until refresh)
          removeReplyFromState(parentId, replyId);

          // final confirmation toast with actor
          pushToast({
            title: currentUser.name,
            message: "deleted a reply",
            snippet: snippet(removed.text, 120),
            canUndo: false,
          });
        } catch (err) {
          console.error("❌ Failed to delete reply from backend:", err);

          // Restore reply in UI at same index
          const restored = commentsRef.current.map((c) =>
            c.id === parentId
              ? {
                  ...c,
                  replies: [
                    ...c.replies.slice(0, idx),
                    removed,
                    ...c.replies.slice(idx),
                  ],
                }
              : c
          );
          updateLocalStorage(restored);

          pushToast({
            title: "Error",
            message: `Could not delete reply by ${removed.author || "someone"}`,
            canUndo: false,
          });

          delete pendingDeletionsRef.current[pendingId];
          cleanupToastByPendingId(pendingId);
        }
      }, TOAST_DURATION);

      pendingDeletionsRef.current[pendingId] = {
        type: "reply",
        item: removed,
        index: idx,
        parentId,
        timeoutId,
      };

      // initial undoable toast
      pushToast({
        title: currentUser.name,
        message: `Removed a reply by ${removed.author?.name || "someone"}`,
        snippet: snippet(removed.text, 120),
        canUndo: true,
        meta: { pendingId },
      });
    },
    [
      updateLocalStorage,
      pushToast,
      cleanupToastByPendingId,
      getTeamId,
      removeReplyFromState,
    ]
  );

  // Add comment
  const addComment = useCallback(async () => {
    const text = (input || "").trim();
    if (!text) return;

    const teamId = getTeamId();
    const bugId =
      bug._id || JSON.parse(localStorage.getItem(bugKey) || "{}")._id;

    try {
      const savedComment = await commentApi.createComment({
        text,
        bugId,
        teamId,
      });

      const normalizedSaved = normalizeComments([savedComment])[0];

      const updated = [normalizedSaved, ...(commentsRef.current || [])];
      updateLocalStorage(updated);

      setInput("");

      pushToast({
        title: currentUser.name,
        message: "Added a comment",
        snippet: snippet(normalizedSaved.text, 120),
        canUndo: false,
      });
    } catch (err) {
      console.error("Failed to save comment:", err);
      pushToast({
        title: "Error",
        message: "Failed to add comment. Try again.",
        canUndo: false,
      });
    }
  }, [input, getTeamId, updateLocalStorage, pushToast, bug._id]);

  // Add reply
  const addReply = useCallback(
    async (parentId) => {
      const text = (replyInput || "").trim();
      if (!text) return;

      const teamId = getTeamId();
      const bugId =
        bug._id || JSON.parse(localStorage.getItem(bugKey) || "{}")._id;

      try {
        const savedReply = await commentApi.createReply({
          parentId,
          text,
          bugId,
          teamId,
        });

        const normalizedSavedReply = normalizeComments([
          { replies: [savedReply], _id: "temp", id: "temp" },
        ])[0].replies[0];

        const updated = commentsRef.current.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), normalizedSavedReply] }
            : c
        );

        updateLocalStorage(updated);

        setReplyInput("");
        setReplyingTo(null);

        const parent = commentsRef.current.find((c) => c.id === parentId);
        pushToast({
          title: currentUser.name,
          message: `Replied to ${
            parent ? parent.author?.name || "a comment" : "a comment"
          }`,
          snippet: snippet(normalizedSavedReply.text, 120),
          canUndo: false,
        });
      } catch (err) {
        console.error("Failed to add reply:", err);
        pushToast({
          title: "Error",
          message: "Failed to add reply. Please try again.",
          canUndo: false,
        });
      }
    },
    [replyInput, getTeamId, updateLocalStorage, pushToast, bug._id]
  );

  const removeComment = useCallback(
    (id) => {
      scheduleCommentDeletion(id);
    },
    [scheduleCommentDeletion]
  );

  const removeReply = useCallback(
    (parentId, replyId) => {
      // hide immediately + schedule backend delete with undo possibility
      scheduleReplyDeletion(parentId, replyId);
    },
    [scheduleReplyDeletion]
  );

  // Update comment (existing implementation kept)
  const updateComment = useCallback(
    async (id, newText) => {
      const trimmed = (newText || "").trim();
      if (!trimmed) {
        pushToast({
          title: "Error",
          message: "Comment text cannot be empty.",
        });
        return;
      }

      try {
        const storedBug = JSON.parse(localStorage.getItem("selectedBug"));
        if (!storedBug)
          throw new Error("No selected bug found in localStorage");

        const res = await axios.patch(
          `${backendUrl}/manage/${id}`, // matches your backend route
          {
            text: newText,
            bug: storedBug, // send the selected bug in request body
          },
          {
            withCredentials: true, // send cookies for authentication
          }
        );

        let updatedFromServer = null;
        if (res && res.data) {
          if (res.data.data) updatedFromServer = res.data.data;
          else if (res.data._id || res.data.id) updatedFromServer = res.data;
          else if (res.data.comment) updatedFromServer = res.data.comment;
        } else if (res && (res._id || res.id || res.comment)) {
          updatedFromServer = res.data || res.comment || res;
        }

        const current = commentsRef.current || [];
        const updatedComments = current.map((c) => {
          if (c.id === id) {
            const newC = {
              ...c,
              text: updatedFromServer ? updatedFromServer.text : trimmed,
            };
            return newC;
          }

          if (c.replies && c.replies.length) {
            const newReplies = c.replies.map((r) =>
              r.id === id
                ? {
                    ...r,
                    text: updatedFromServer ? updatedFromServer.text : trimmed,
                  }
                : r
            );
            return { ...c, replies: newReplies };
          }
          return c;
        });

        updateLocalStorage(updatedComments);

        pushToast({
          title: currentUser.name,
          message: "Edited a comment",
          snippet: snippet(trimmed, 120),
        });
      } catch (err) {
        console.error("Failed to update comment:", err);
        pushToast({
          title: "Error",
          message: "Failed to update the comment. Try again.",
        });
      }
    },
    [updateLocalStorage, pushToast]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === "Enter") {
        if (replyingTo !== null) addReply(replyingTo);
        else addComment();
        return;
      }
      if (e.key === "Escape") {
        setReplyingTo(null);
        setShowEmojiPicker(false);
        return;
      }
      if (e.key === "/" && !isTyping()) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (mod && e.key === ".") {
        e.preventDefault();
        setShowAdvancedInput((s) => !s);
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowAdvancedInput(true);
        setShowEmojiPicker((s) => !s);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [replyingTo, addComment, addReply]);

  const toggleEmojiPicker = () => setShowEmojiPicker((s) => !s);

  const addEmoji = (emoji) => {
    if (replyingTo) {
      setReplyInput((p) => p + emoji);
    } else {
      setInput((p) => p + emoji);
      inputRef.current?.focus();
    }
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredAndSortedComments = useMemo(() => {
    let filtered = (comments || []).filter((c) => {
      const query = searchQuery.toLowerCase();
      const inParent = c.text?.toLowerCase().includes(query);
      const inReplies = c.replies?.some((r) =>
        r.text?.toLowerCase().includes(query)
      );
      return inParent || inReplies;
    });

    if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return filtered;
  }, [comments, searchQuery, sortBy]);

  // keep commentsRef synced whenever comments state changes
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  // keep visibleToastsRef synced whenever visibleToasts state changes
  useEffect(() => {
    visibleToastsRef.current = visibleToasts;
  }, [visibleToasts]);

  // Render
  return (
    <div
      className="h-full flex flex-col rounded-xl shadow-2xl relative"
      style={{
        "--theme": "#2C2C2C",
        "--surface": "var(--theme)",
        "--border": "rgba(255,255,255,0.06)",
        "--text": "#E6E6E6",
        "--muted": "rgba(230,230,230,0.64)",
        "--accent": "#7C3AED",
        padding: 0,
        backgroundColor: "var(--surface)",
      }}
    >
      <style>{`
            .cs-search-input::placeholder { color: rgba(230,230,230,0.6); font-weight: 700; letter-spacing: 0.2px; }
            .cs-write-input::placeholder { color: rgba(230,230,230,0.48); font-weight: 500; font-size: 16px; }
            .cs-write-input:focus, .cs-search-input:focus { outline: none; box-shadow: 0 6px 24px rgba(79,70,229,0.12), 0 0 0 4px rgba(124,58,237,0.06); }
            .cs-send-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(79,70,229,0.16); }
            .cs-search-input { font-weight: 600; }
            @media (max-width: 480px) { .cs-send-btn { width: 76px; padding-left: 12px; padding-right: 12px; } }
          `}</style>

      <Toasts
        list={visibleToasts}
        removeToast={removeToast}
        onUndo={handleUndo}
      />

      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h3 className=" text-lg font-semibold" style={{ color: "var(--text)" }}>
          Comments
        </h3>
        <div className="flex items-center gap-3">
          <div
            className="ml-2 flex items-center rounded-[10px] px-3 py-2 text-sm cs-search"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.55)",
            }}
          >
            <svg
              className="h-4 w-4 mr-3"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              stroke="currentColor"
            >
              <path
                d="M21 21l-4.35-4.35"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="11"
                cy="11"
                r="6"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={searchRef}
              className="cs-search-input bg-transparent outline-none"
              style={{ color: "var(--muted)", minWidth: 180 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                title="Clear"
                className="ml-3 px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.02)] transition"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
            )}
          </div>
          <CustomDropdown
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
            ]}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      {/* comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredAndSortedComments.length === 0 && (
          <p
            className="text-center text-sm italic"
            style={{ color: "var(--muted)" }}
          >
            {searchQuery
              ? "No comments match your search."
              : "No comments yet — be the first to add one."}
          </p>
        )}
        {filteredAndSortedComments.map((c) => (
          <div
            key={c.id}
            className="transform transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{ borderRadius: 12 }}
          >
            <CommentItem
              comment={c}
              removeComment={removeComment}
              removeReply={removeReply}
              setReplyingTo={setReplyingTo}
              replyingTo={replyingTo}
              replyInput={replyInput}
              setReplyInput={setReplyInput}
              addReply={addReply}
              updateComment={updateComment}
              currentUser={currentUser}
            />
          </div>
        ))}
      </div>

      {/* input area */}
      <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="relative flex items-center">
          <div style={{ flex: 1, position: "relative" }}>
            <div
              className="cs-write-wrap"
              style={{
                borderRadius: 14,
                padding: "12px 140px 12px 20px",
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.04)",
                boxShadow: "inset 0 6px 18px rgba(0,0,0,0.6)",
              }}
            >
              <input
                ref={inputRef}
                className="cs-write-input bg-transparent w-full"
                style={{ color: "var(--text)", fontSize: 16 }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a comment..."
                onFocus={() => setShowAdvancedInput(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
            </div>
            <button
              onClick={addComment}
              disabled={(input || "").trim() === ""}
              className="cs-send-btn"
              style={{
                position: "absolute",
                right: 5,
                top: "50%",
                transform: "translateY(-50%)",
                height: 38,
                width: 104,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontWeight: 700,
                cursor: (input || "").trim() === "" ? "not-allowed" : "pointer",
                transition: "all .14s ease",
                background:
                  (input || "").trim() === ""
                    ? "linear-gradient(90deg,#333,#2b2b2b)"
                    : "linear-gradient(90deg,var(--accent), #4F46E5)",
                color: "white",
                boxShadow:
                  (input || "").trim() === ""
                    ? "none"
                    : "0 8px 28px rgba(79,70,229,0.20)",
                opacity: (input || "").trim() === "" ? 0.6 : 1,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="-mt-0.5"
              >
                <path d="M3 11L21 3L14 21L11 14L3 11Z" fill="currentColor" />
              </svg>
              Send
            </button>
          </div>
        </div>

        {showAdvancedInput && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2" ref={emojiRef}>
              <button
                onClick={() => setShowAdvancedInput(false)}
                title="Close extra"
                className="p-1 rounded-md"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
              <div className="relative">
                <button
                  onClick={toggleEmojiPicker}
                  className="p-1 rounded-md"
                  style={{ color: "var(--muted)" }}
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <div
                    className="absolute left-0 bottom-12 w-44 rounded-md shadow-lg p-2 z-50"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="grid grid-cols-6 gap-2">
                      {EMOJIS.map((emo) => (
                        <button
                          key={emo}
                          onClick={() => addEmoji(emo)}
                          className="p-1 text-lg rounded"
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                    <div
                      className="mt-2 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      Click to insert
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Press Ctrl+Enter to send.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
