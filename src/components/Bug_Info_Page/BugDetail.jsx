import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatusToggle from "../UI/StatusToggle";
import PriorityBadge from "../UI/PriorityBadge";
import AssignBugBadge from "../UI/AssignBugBadge";
import CalendarDropdown from "../UI/CalendarDropdown";
import FileUpload from "../UI/FileUpload";
import FileList from "../UI/FileList";
import BugAttachment from "../UI/BugAttachment";
import BugAttachmentsList from "../UI/BugAttachmentsList";
import FileUploader from "../UI/FileUploader";
import Comments from "./Comments";
import LoadingScreen from "../UI/LoadingScreen";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// 740
// 🔹 Lucide icons (use distinct aliases to avoid collisions)
import {
  X,
  Layers,
  Calendar,
  FileText as DescriptionIcon, // used for the "Description" label AND DOC file cards
  UploadCloud,
  File as FileIcon, // generic file
  FileType, // txt/md
  FileArchive, // pdf
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Edit3,
  Check,
} from "lucide-react";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// 🔹 Drag & drop reorder
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const PREVIEW_LIMIT = 7; // how many attachments to show initially (most recent)

const BugDetails = ({ onClose }) => {
  const [bug, setBug] = useState(null);
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagError, setTagError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // 🔹 Image preview modal state is indexed over *imageAttachments* only
  const [previewImageIndex, setPreviewImageIndex] = useState(null);

  // 🔹 Upload simulation state
  const [uploadingFiles, setUploadingFiles] = useState([]); // { id: finalId, tempId, file, progress }
  const uploadIntervalsRef = useRef({});

  // 🔹 Show all / collapsed set for previews
  const [showAll, setShowAll] = useState(false);

  const audioRef = useRef(null);
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  // left panel ref for scroll tracking
  const leftPanelRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef(null);
  const [titleDraft, setTitleDraft] = useState("");

  // Update state tracking
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSavedBug, setLastSavedBug] = useState(null);
  const updateTimeoutRef = useRef(null);

  // Theme state (kept in selectedBug.theme)
  const [themeChoice, setThemeChoice] = useState("");

  // Attachments refresh trigger
  const [attachmentsRefreshTrigger, setAttachmentsRefreshTrigger] = useState(0);

  // 🔹 Quill toolbar config (attachments removed)
  const quillModules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
    ],
  };

  // 🔹 Helper: count words
  const messageWordCount = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    const text = div.textContent?.trim() || "";
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  };

  // 🔹 Handle file upload completion
  const handleFileUploaded = (uploadedFile) => {
    // console.log("File uploaded:", uploadedFile);
    
    // Trigger refresh of attachments list
    setAttachmentsRefreshTrigger(prev => prev + 1);
  };

  // 🔹 Handle file deletion
  const handleFileDeleted = (fileId) => {
    // console.log("File deleted:", fileId);
    
    // Trigger refresh of attachments list
    setAttachmentsRefreshTrigger(prev => prev + 1);
  };

  // -----------------------------
  // THEME: use #2c2c2c as primary and create balanced gray shades
  // -----------------------------
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      /* Root theme (scoped to the component root .bug-theme) */
      .bug-theme.root-container {
        --primary: #2c2c2c;        /* your requested base */
        --primary-100: #343434;
        --primary-200: #2c2c2c;
        --primary-300: #232323;
        --bg: #121212;             /* overall background (dark gray, not pure black) */
        --surface: #1e1e1e;        /* main panel surface (slightly lighter) */
        --surface-2: #252525;      /* cards */
        --surface-3: #2b2b2b;      /* subtle contrast */
        --card: #2f2f2f;
        --muted: rgba(230,230,230,0.64);
        --text: #ffffff;           /* keep important text white */
        --subtext: rgba(230,230,230,0.78);
        --border: rgba(255,255,255,0.06);
        --accent: #6366f1;
        --accent-2: #8b5cf6;
        --danger: #ef4444;
        --success: #10b981;
        font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui;
      }

      /* Container backgrounds */
      .bug-theme.root-container { background: linear-gradient(180deg, var(--bg), #0f0f0f); color: var(--text); }
      .bug-theme .left-panel { background: linear-gradient(180deg, var(--surface), var(--surface-2)); }
      .bug-theme .right-panel { background: var(--surface-2); }

      /* Quill toolbar + editor tuned to the palette */
      .bug-theme .ql-toolbar {
        background: var(--surface-2) !important;
        border: 1px solid var(--border) !important;
        border-top-left-radius: 0.75rem;
        border-top-right-radius: 0.75rem;
        padding: 6px 8px;
      }
      .bug-theme .ql-toolbar button { border-radius: 8px !important; transition: all 0.2s ease !important; }
      .bug-theme .ql-toolbar button:hover { background: rgba(99,102,241,0.06) !important; box-shadow: 0 0 6px rgba(99,102,241,0.06); }
      .bug-theme .ql-toolbar button svg { stroke: #cfcfcf !important; }
      .bug-theme .ql-toolbar .ql-active svg { stroke: var(--accent) !important; }

      .bug-theme .ql-container {
        background: var(--card) !important;
        border: 1px solid var(--border) !important;
        border-top: none !important;
        min-height: 140px;
        color: var(--subtext);
        border-bottom-left-radius: 0.75rem;
        border-bottom-right-radius: 0.75rem;
      }
      .bug-theme .ql-editor { min-height: 140px; padding: 14px 16px; line-height: 1.6; color: var(--subtext); }
      .bug-theme .ql-editor::before { color: #8a8a8a !important; font-style: italic; }

      .bug-theme .ql-editor a { color: #7fb7ff !important; border-bottom: 1px dashed #7fb7ff; }
      .bug-theme .ql-editor a:hover { color: #bfe1ff !important; border-bottom: 1px solid #bfe1ff; }

      /* Custom scrollbars */
      .bug-theme .custom-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
      .bug-theme .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .bug-theme .custom-scroll::-webkit-scrollbar-thumb {
        background-color: rgba(99,102,241,0.18);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: padding-box;
        transition: background-color 0.2s ease, transform 0.15s ease;
      }
      .bug-theme .custom-scroll:hover::-webkit-scrollbar-thumb { background-color: rgba(99,102,241,0.36); transform: scale(1.03); }
      .bug-theme .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.18) transparent; }

      /* Scroll progress bar */
      .bug-theme .scroll-progress-track { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: rgba(255,255,255,0.02); z-index: 80; }
      .bug-theme .scroll-progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), var(--accent-2), #06b6d4); border-radius: 999px; transition: width 200ms cubic-bezier(.2,.9,.2,1); box-shadow: 0 4px 12px rgba(99,102,241,0.12); }

      /* Title: professional UI - white by default, gradient-on-hover, refined font */
      .bug-theme .professional-title {
        color: var(--text); /* white by default */
        font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui;
        font-weight: 800;
        font-size: 2.6rem;
        line-height: 1.02;
        letter-spacing: -0.01em;
        transition: all 240ms ease;
        display: inline-block;
        padding: 2px 4px;
      }
      .bug-theme .professional-title:hover {
        background-image: linear-gradient(90deg, var(--accent), var(--accent-2), #06b6d4);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        transform: translateY(-3px) scale(1.02);
        text-shadow: 0 8px 30px rgba(0,0,0,0.6);
      }

      /* Title controls */
      .bug-theme .title-control-btn { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 8px; }
      .bug-theme .title-control-btn:hover { background: rgba(255,255,255,0.04); transform: translateY(-2px); }

      /* Tags area: minimal black-ish but harmonized with gray palette */
      .bug-theme .tags-container {
        background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.06));
        border: 1px solid rgba(255,255,255,0.03);
        padding: 16px;
        border-radius: 12px;
      }
      .bug-theme .tag-pill {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.03);
        color: var(--text);
      }
      .bug-theme .tag-pill:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }

      /* Editor card and tile harmonization */
      .bug-theme .editor-card { background: linear-gradient(180deg, var(--card), var(--surface-3)); }
      .bug-theme .progress-bar { background: linear-gradient(90deg, rgba(99,102,241,0.22), rgba(139,92,246,0.18)); }
      .bug-theme .progress-bar.fast { background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
      .bug-theme .progress-bar.critical { background: linear-gradient(90deg, var(--danger), #ff7a7a); }

      .bug-theme .file-tile-default { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px; }

      .bug-theme .hover-glow { transition: transform 220ms ease, box-shadow 220ms ease; }
      .bug-theme .hover-glow:hover { transform: translateY(-6px); box-shadow: 0 28px 48px rgba(99,102,241,0.06); }

      /* small slide-in animation kept for content */
      .bug-theme .slide-in { transform: translateY(8px); opacity: 0; animation: slideInUp 420ms cubic-bezier(.2,.9,.3,1) forwards; }
      @keyframes slideInUp { to { transform: translateY(0); opacity: 1; } }

      /* small responsive tweaks for title input */
      .bug-theme .title-input { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 8px 12px; border-radius: 10px; color: var(--text); outline: none; min-width: 360px; font-size: 1.2rem; font-weight: 700; }
      .bug-theme .title-input:focus { box-shadow: 0 8px 30px rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.35); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // clear upload intervals on unmount + cleanup update timeout
  useEffect(() => {
    return () => {
      // Cleanup intervals
      Object.values(uploadIntervalsRef.current).forEach((i) =>
        clearInterval(i)
      );
      uploadIntervalsRef.current = {};
      
      // Clear any pending update timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // 🔹 Load bug from localStorage with better error handling
  useEffect(() => {
    let storedBug = null;
    let hasValidData = false;
    
    try {
      const stored = localStorage.getItem("selectedBug");
      // Check if stored is null, undefined, or the string "undefined"
      if (stored && stored !== "undefined" && stored !== "null") {
        storedBug = JSON.parse(stored);
        if (storedBug && storedBug._id && storedBug.title) {
          hasValidData = true;
        }
      } else if (stored === "undefined" || stored === "null") {
        // Clean up corrupted data
        console.warn("Cleaning up corrupted localStorage data:", stored);
        localStorage.removeItem("selectedBug");
      }
    } catch (error) {
      console.warn("Failed to parse selectedBug from localStorage:", error);
      // Clear the corrupted data
      localStorage.removeItem("selectedBug");
    }
    
    if (hasValidData && storedBug) {
      // Load existing bug data
      setBug(storedBug);
      setLastSavedBug(storedBug); // Initialize lastSavedBug to prevent immediate API call
      setTags(storedBug.tags || []);
      setDescription(storedBug.description || "");

      if (storedBug?.startDate) {
        const date = new Date(storedBug.startDate);
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        const formatted = `${day}/${month}/${year}`;
        setStartDate(formatted);
      }

      if (storedBug?.dueDate) {
        const due = new Date(storedBug.dueDate);
        const dueDayFormatted = due.toLocaleDateString("en-GB"); // dd/mm/yyyy for UI
        setDueDate(dueDayFormatted);
      }
      
      setWordCount(messageWordCount(storedBug.description || ""));
      setTitleDraft(storedBug.title || "");
      setThemeChoice(storedBug.theme || "");
      
      // console.log("Loaded existing bug:", storedBug._id, storedBug.title);
    } else {
      // No valid data found - create a new bug template only if needed
      // console.log("No valid bug data found, creating new bug template");
      
      // Get team info for new bug
      let teamId = null;
      try {
        const activeTeamStored = localStorage.getItem('activeTeam');
        if (activeTeamStored) {
          const activeTeam = JSON.parse(activeTeamStored);
          teamId = activeTeam?._id;
        }
      } catch (e) {
        console.warn("Could not get active team:", e);
      }
      
      const newBug = {
        _id: `temp-${Date.now()}`,
        title: "New Bug Report",
        description: "",
        status: "OPEN",
        priority: "Medium", 
        tags: [],
        attachments: [],
        assignedName: [],
        createdAt: new Date().toISOString(),
        dueDate: null,
        teamId: teamId
      };
      
      setBug(newBug);
      setLastSavedBug(null); // Don't set lastSavedBug for new bugs
      setTags([]);
      setDescription("");
      setTitleDraft("New Bug Report");
      setThemeChoice("");
      
      // Set current date as start date
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      setStartDate(`${day}/${month}/${year}`);
      
      // console.log("Created new bug template with ID:", newBug._id);
    }
  }, []);

// Save bug to backend after 1s of inactivity with deduplication and instant persistence
useEffect(() => {
  if (!bug?._id) return;

  // Always save to localStorage immediately for data persistence
  try {
    if (bug && bug._id && bug.title) {
      localStorage.setItem("selectedBug", JSON.stringify(bug));
    }
  } catch (e) {
    console.warn("Failed to save bug to localStorage:", e);
  }

  // Skip API calls during active updates
  if (isUpdating) return;

  // Skip saving if bug has temp ID - will be handled separately
  const isTempBug = String(bug._id).startsWith('temp-');
  
  // Check if bug actually changed (deep comparison of relevant fields)
  const currentBugForComparison = {
    title: bug.title,
    description: bug.description,
    status: bug.status,
    priority: bug.priority,
    tags: bug.tags,
    assignedName: bug.assignedName,
    startDate: bug.startDate,
    dueDate: bug.dueDate,
    createdAt: bug.createdAt
  };

  const lastBugForComparison = lastSavedBug ? {
    title: lastSavedBug.title,
    description: lastSavedBug.description,
    status: lastSavedBug.status,
    priority: lastSavedBug.priority,
    tags: lastSavedBug.tags,
    assignedName: lastSavedBug.assignedName,
    startDate: lastSavedBug.startDate,
    dueDate: lastSavedBug.dueDate,
    createdAt: lastSavedBug.createdAt
  } : null;

  // Skip API call if data hasn't actually changed
  if (lastBugForComparison && JSON.stringify(currentBugForComparison) === JSON.stringify(lastBugForComparison)) {
    return;
  }

  // Clear any pending timeout
  if (updateTimeoutRef.current) {
    clearTimeout(updateTimeoutRef.current);
  }

  updateTimeoutRef.current = setTimeout(async () => {
    if (isUpdating) return; // Double-check to prevent concurrent updates

    try {
      setIsUpdating(true);

      // Get the teamId from the bug object or localStorage
      const teamId = bug.teamId || bug.team || 
        (() => {
          try {
            const stored = localStorage.getItem('activeTeam');
            if (!stored) return null;
            const activeTeam = JSON.parse(stored);
            return activeTeam?._id;
          } catch {
            return null;
          }
        })();
      
      if (!teamId) {
        console.error('No teamId available for bug update');
        return;
      }

      // Transform status to lowercase before sending to backend
      const bugUpdatePayload = {
        ...bug,
        status: bug.status ? bug.status.toLowerCase() : bug.status,
        teamId: teamId // Ensure teamId is included
      };

      let response;
      
      if (isTempBug) {
        // Create new bug for temp IDs
        // console.log('Creating new bug...');
        response = await axios.post(
          `${backendUrl}/bug?teamId=${teamId}`,
          bugUpdatePayload,
          { withCredentials: true }
        );
      } else {
        // Update existing bug
        console.log('Updating existing bug with payload:', bugUpdatePayload);
        response = await axios.patch(
          `${backendUrl}/bug/manage/${bug._id}?teamId=${teamId}`,
          bugUpdatePayload,
          { withCredentials: true }
        );
      }

      // Update component state with the response
      const updatedBug = response.data.bug;
      
      // Log the response for assignment debugging
      console.log("Backend response - Updated bug:", updatedBug);
      console.log("Updated assignedName:", updatedBug.assignedName);
      
      // Sync all state with backend response
      setBug(updatedBug);
      setLastSavedBug(updatedBug);
      
      // Update localStorage with fresh data
      localStorage.setItem("selectedBug", JSON.stringify(updatedBug));
      
      // Update local state variables to match backend
      setTags(updatedBug.tags || []);
      setDescription(updatedBug.description || "");
      setTitleDraft(updatedBug.title || "");
      
      // Update date fields properly
      if (updatedBug?.startDate) {
        const date = new Date(updatedBug.startDate);
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        const formatted = `${day}/${month}/${year}`;
        setStartDate(formatted);
      }
      
      if (updatedBug?.dueDate) {
        const due = new Date(updatedBug.dueDate);
        const dueDayFormatted = due.toLocaleDateString("en-GB");
        setDueDate(dueDayFormatted);
      }
      
      console.log("Bug saved successfully:", updatedBug._id, updatedBug.status);
      console.log("Assignment successfully updated:", updatedBug.assignedName);
    } catch (err) {
      console.error("Failed to save bug:", err);
      console.error("Error details:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Full error object:", err);
      
      // Show user-friendly error message
      const errorMessage = err.response?.data?.message || "Failed to save changes. Please try again.";
      console.error("Save error details:", errorMessage);
      
      // Don't revert state - keep user changes but attempt to save again later
      // console.log("Keeping current changes despite save error");
      
      // TODO: Show user notification about error
      // For now, just log it - you can add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  }, 800); // Reduced debounce to 0.8 seconds for faster saves

  return () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  };
}, [bug, isUpdating]);



  // 🔹 Update bug state + persist with better synchronization
  // Accept either an object of fields OR a function(prevBug) => newBug
  const updateBug = (updatedFields) => {
    setBug((prev) => {
      if (!prev) return prev; // Guard against null/undefined
      
      const updatedBug =
        typeof updatedFields === "function"
          ? updatedFields(prev)
          : { ...prev, ...updatedFields };
      
      // Ensure critical fields are preserved
      if (!updatedBug._id || !updatedBug.title) {
        console.warn("Critical bug fields missing, preserving original");
        return prev;
      }
      
      try {
        // Only save to localStorage if bug has valid structure
        if (updatedBug && updatedBug._id && updatedBug.title) {
          localStorage.setItem("selectedBug", JSON.stringify(updatedBug));
        }
      } catch (e) {
        console.warn("Failed to save bug to localStorage:", e);
      }
      
      return updatedBug;
    });
  };

  // Title editing handlers
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      // move cursor to end
      const el = titleInputRef.current;
      const val = el.value;
      el.value = "";
      el.value = val;
    }
  }, [isEditingTitle]);

  const commitTitle = () => {
    const newTitle = (titleDraft || "").trim();
    setIsEditingTitle(false);
    updateBug((p) => ({ ...(p || {}), title: newTitle }));
    
    // Force immediate localStorage save for title
    const updatedBug = { ...bug, title: newTitle };
    localStorage.setItem("selectedBug", JSON.stringify(updatedBug));
  };

  // theme change handler
  const selectTheme = (t) => {
    setThemeChoice(t);
    updateBug((p) => ({ ...(p || {}), theme: t }));
  };

  // 🔹 Add tag
  const addTag = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();

      if (tags.includes(newTag)) {
        setTagError("Tag already exists!");
        return;
      }
      if (tags.length >= 10) {
        setTagError("Maximum 10 tags allowed!");
        return;
      }

      const newTags = [...tags, newTag];
      setTags(newTags);
      updateBug((prev) => ({ ...prev, tags: newTags }));
      e.target.value = "";
      setTagError("");
      
      // Force immediate localStorage save for tags
      const updatedBug = { ...bug, tags: newTags };
      localStorage.setItem("selectedBug", JSON.stringify(updatedBug));
    }
  };

  // 🔹 Remove tag
  const removeTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    updateBug((prev) => ({ ...prev, tags: newTags }));
    
    // Force immediate localStorage save for tags
    const updatedBug = { ...bug, tags: newTags };
    localStorage.setItem("selectedBug", JSON.stringify(updatedBug));
  };

  // 🔹 Mobile vibration + sound on critical (near 1000)
  useEffect(() => {
    if (wordCount > 900) {
      if (navigator.vibrate) navigator.vibrate(200);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [wordCount]);

  // ========= ATTACHMENTS HELPERS =========

  // 👇 All attachments and image-only list (original order)
  const allAttachments = bug?.attachments || [];
  const imageAttachments =
    allAttachments.filter((f) => f.type?.startsWith("image/")) || [];

  // Map from original index -> image index (so preview navigates images only)
  const imageIndexMap = new Map();
  allAttachments.forEach((f, i) => {
    if (f.type?.startsWith("image/")) {
      imageIndexMap.set(i, imageIndexMap.size);
    }
  });

  // Utility: get array of original indices to display (most recent subset or all)
  const getDisplayedIndices = () => {
    const n = allAttachments.length;
    const indices = Array.from({ length: n }, (_, i) => i); // [0..n-1] original order
    if (showAll || n <= PREVIEW_LIMIT) return indices; // show all in original order
    // show most recent PREVIEW_LIMIT (last ones)
    const start = Math.max(0, n - PREVIEW_LIMIT);
    return indices.slice(start, n); // ascending (older -> newer)
  };

  // For UI we want most recent first visually
  const displayedIndices = getDisplayedIndices(); // ascending original indices
  const displayedCount = displayedIndices.length;
  const visuallyOrderedIndices = [...displayedIndices].reverse(); // newest first visually

  // 🔹 Keyboard navigation for image modal (ESC, ←, →)
  useEffect(() => {
    if (previewImageIndex === null) return;

    const handleKeyDown = (e) => {
      if (imageAttachments.length === 0) return;
      if (e.key === "Escape") setPreviewImageIndex(null);
      if (e.key === "ArrowRight") {
        setPreviewImageIndex((prev) => (prev + 1) % imageAttachments.length);
      }
      if (e.key === "ArrowLeft") {
        setPreviewImageIndex(
          (prev) =>
            (prev - 1 + imageAttachments.length) % imageAttachments.length
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImageIndex, imageAttachments.length]);

  // 🔹 Swipe support in modal (mobile)
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    touchStart.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e) => {
    touchEnd.current = e.changedTouches[0].clientX;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance) {
      setPreviewImageIndex((prev) => (prev + 1) % imageAttachments.length);
    } else if (distance < -minSwipeDistance) {
      setPreviewImageIndex(
        (prev) => (prev - 1 + imageAttachments.length) % imageAttachments.length
      );
    }
  };

  // 🔹 Simulated upload with immediate temp preview + replacement on completion
  const simulateUpload = (file) => {
    const finalId = Date.now() + Math.floor(Math.random() * 1000);
    const tempId = `temp-${finalId}-${Math.floor(Math.random() * 1000)}`;
    const blobUrl = URL.createObjectURL(file);

    const tempAttachment = {
      id: tempId,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      url: blobUrl,
      _temp: true,
    };

    // Append temp immediately so user can preview multiple selections at once
    updateBug((prev) => ({
      ...(prev || {}),
      attachments: [...(prev?.attachments || []), tempAttachment],
    }));

    let progress = 0;
    setUploadingFiles((prev) => [
      ...prev,
      { id: finalId, tempId, file, progress },
    ]);

    const interval = setInterval(() => {
      progress += 12 + Math.floor(Math.random() * 10);
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === finalId ? { ...f, progress: Math.min(progress, 100) } : f
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
        delete uploadIntervalsRef.current[finalId];

        const finalAttachment = {
          id: finalId,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          url: blobUrl, // reuse blob URL
        };

        // Replace temp with final atomically
        updateBug((prev) => {
          const old = prev || {};
          const attachments = (old.attachments || []).map((a) =>
            a.id === tempId ? finalAttachment : a
          );
          // If temp was missing (edge case), append final
          const hasFinal = attachments.some(
            (a) => String(a.id) === String(finalId)
          );
          const result = hasFinal
            ? attachments
            : [...attachments.filter((a) => a.id !== tempId), finalAttachment];
          return { ...old, attachments: result };
        });

        setUploadingFiles((prev) => prev.filter((f) => f.id !== finalId));
      }
    }, 300);

    uploadIntervalsRef.current[finalId] = interval;
  };

  const handleFileUpload = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => simulateUpload(file));
  };

  const cancelUpload = (uploadId) => {
    const interval = uploadIntervalsRef.current[uploadId];
    if (interval) {
      clearInterval(interval);
      delete uploadIntervalsRef.current[uploadId];
    }

    // remove from uploadingFiles and remove associated temp attachment (if any)
    const uploadingEntry = uploadingFiles.find((u) => u.id === uploadId);
    setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));

    if (uploadingEntry?.tempId) {
      updateBug((prev) => {
        const attachments = (prev?.attachments || []).filter(
          (a) => a.id !== uploadingEntry.tempId
        );
        return { ...(prev || {}), attachments };
      });
    }
  };

  // 🔹 Handle reordering (react-beautiful-dnd)
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    // source/destination are indices into visuallyOrderedIndices (newest-first visual order)
    const srcVisualIdx = result.source.index;
    const dstVisualIdx = result.destination.index;

    // Map visual index -> original index
    const srcOriginalIdx = visuallyOrderedIndices[srcVisualIdx];
    const dstOriginalIdx = visuallyOrderedIndices[dstVisualIdx];

    const reordered = Array.from(bug.attachments || []);

    const srcId = (allAttachments[srcOriginalIdx] || {}).id;
    const dstId = (allAttachments[dstOriginalIdx] || {}).id;

    const srcIndexInArray = reordered.findIndex(
      (a) => String(a.id) === String(srcId)
    );
    const dstIndexInArray = reordered.findIndex(
      (a) => String(a.id) === String(dstId)
    );

    if (srcIndexInArray === -1 || dstIndexInArray === -1) return;

    const [moved] = reordered.splice(srcIndexInArray, 1);
    reordered.splice(dstIndexInArray, 0, moved);

    updateBug((prev) => ({ ...(prev || {}), attachments: reordered }));
  };

  // 🔹 Remove existing attachment
  const removeAttachment = (index) => {
    const newAttachments = allAttachments.filter((_, i) => i !== index);
    updateBug((prev) => ({ ...(prev || {}), attachments: newAttachments }));
    if (previewImageIndex !== null) {
      setPreviewImageIndex(null);
    }
  };

  // 🔹 Utility: format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // scroll handler to update progress bar (smooth)
  const handleLeftScroll = () => {
    const el = leftPanelRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max <= 0 ? 0 : (el.scrollTop / max) * 100;
    setScrollProgress(pct);
  };

  useEffect(() => {
    // attach listener
    const el = leftPanelRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleLeftScroll, { passive: true });
    // initial update
    handleLeftScroll();
    return () => {
      el.removeEventListener("scroll", handleLeftScroll);
    };
  }, [bug, leftPanelRef.current]);

  // Only show loading state briefly, don't block the UI
  if (!bug) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading bug details...</div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min((wordCount / 1000) * 100, 100);
  const total = allAttachments.length;
  const remainingCount = Math.max(0, total - displayedCount);

  // -------------------------
  // Layout: two-column fullscreen modal with bottom scroll progress bar
  // -------------------------
  return (
    // ⚠️ Updated: This parent container now spans the entire viewport
    <div
      className=" fixed inset-0 bg-black/40 backdrop-blur-sm flex z-50 overflow-hidden"
      aria-modal="true"
      role="dialog"
    >
      {/* theme root and layout */}
      <div className="bug-theme root-container relative w-full h-full flex">
        {/* Left Panel */}
        <motion.div
          ref={leftPanelRef}
          className={`left-panel flex-[0.7] max-h-full overflow-y-auto p-10 pr-6 transition-all relative custom-scroll`}
          initial={{ opacity: 0.98 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white animated-label mb-2">
                Bug Details
              </h2>
              
              <br />
              {/* Editable title area */}
              <div className="mt-1 editable-title-wrapper items-start">
                {!isEditingTitle ? (
                  <div className="flex items-center gap-3">
                    <motion.h3
                      className="professional-title slide-in cursor-pointer truncate"
                      title="Double-click to edit"
                      onDoubleClick={() => {
                        setTitleDraft(bug?.title || "");
                        setIsEditingTitle(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                      }}
                      style={{ lineHeight: 1.02 }}
                    >
                      {bug?.title || "Untitled bug"}
                    </motion.h3>

                    {/* pencil button */}
                    <motion.button
                      onClick={() => {
                        setTitleDraft(bug?.title || "");
                        setIsEditingTitle(true);
                      }}
                      whileHover={{ scale: 1.08 }}
                      className="title-control-btn p-2 rounded-md bg-transparent text-gray-300 hover:bg-white/5"
                      title="Edit title"
                    >
                      <Edit3 size={18} />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      ref={titleInputRef}
                      className="title-input"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={() => commitTitle()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitTitle();
                        if (e.key === "Escape") {
                          setIsEditingTitle(false);
                          setTitleDraft(bug?.title || "");
                        }
                      }}
                      aria-label="Edit bug title"
                    />
                    <motion.button
                      onClick={() => commitTitle()}
                      whileHover={{ scale: 1.05 }}
                      className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center"
                      title="Save title"
                    >
                      <Check size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setIsEditingTitle(false);
                        setTitleDraft(bug?.title || "");
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="p-2 rounded-md bg-[#2a2a2a] hover:bg-white/5 text-gray-300 flex items-center"
                      title="Cancel edit"
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ rotate: 90, scale: 1.06 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
              aria-label="Close"
              title="Close"
            >
              <X size={22} />
            </motion.button>
          </div>

          {/* Info Box */}
          <motion.div
            className="p-6 rounded-xl bg-[#252525] hover:bg-[#2f2f2f] transition-colors duration-300 relative z-10 hover-glow slide-in"
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="grid gap-6">
              {/* Status + Assignees */}
              <div className="flex border-b border-gray-700 pb-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers size={20} className="text-gray-400" />
                  <p className="text-gray-300 text-base font-semibold animated-label">
                    Status
                  </p>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="inline-flex ml-2 items-center gap-2"
                  >
                    <StatusToggle
                      status={bug?.status}
                      onChange={(val) =>
                        updateBug((p) => ({ ...(p || {}), status: val }))
                      }
                    />
                  </motion.div>
                </div>

                {/* nudged left slightly so dropdowns stay inside modal & don't overlap */}
                <div className="mr-20 flex items-center gap-3 relative z-[70]">
                  {/* wrapper has higher z so any dropdown from AssignBadge is more likely to appear in front */}
                  <div className="relative z-[70]">
                    <AssignBugBadge
                      value={bug?.assignedName || []}
                      onChange={(val) => {
                        console.log("=== BugDetail Assignment Update ===");
                        console.log("Current bug.assignedName:", bug?.assignedName);
                        console.log("New assignedName value:", val);
                        console.log("Value details:", val.map(v => ({ name: v.name, email: v.email, hasEmail: !!v.email })));
                        console.log("===================================");
                        updateBug((p) => ({ ...(p || {}), assignedName: val }));
                      }}
                      compact={false}
                      key={`assign-badge-${bug?._id}-${JSON.stringify(bug?.assignedName)}`} // Force re-render when data changes
                    />
                  </div>
                </div>
              </div>

              {/* Dates + Priority */}
              <div className="flex border-b border-gray-700 pb-4 items-center justify-between">
                <div className=" flex items-center gap-3 relative">
                  <Calendar size={20} className="text-gray-400" />
                  <p className="text-gray-300 text-base font-semibold animated-label">
                    Dates
                  </p>

                  <div className="flex gap-3 ml-2 items-center">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="inline-block relative"
                    >
                      <CalendarDropdown
                        value={startDate}
                        onChange={(val) => {
                          setStartDate(val);
                          // Convert to ISO format for backend storage
                          const dateObj = new Date(val);
                          const isoDate = dateObj.toISOString();
                          updateBug((p) => ({ ...(p || {}), startDate: isoDate }));
                        }}
                        placeholder="Start Date"
                        dropdownClassName="absolute left-0 mt-2 w-48 bg-[#2a2a2a] rounded-xl shadow-lg z-50"
                        aria-label="Start Date"
                      />
                    </motion.div>

                    {/* proper chevron arrow between fields */}
                    <span className="text-gray-500 mx-1">
                      <ChevronRight size={16} className="text-gray-400" />
                    </span>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="inline-block relative"
                    >
                      <CalendarDropdown
                        value={dueDate}
                        onChange={(val) => {
                          setDueDate(val);
                          // Convert to ISO format for backend storage
                          const dateObj = new Date(val);
                          const isoDate = dateObj.toISOString();
                          updateBug((p) => ({ ...(p || {}), dueDate: isoDate }));
                        }}
                        placeholder="End Date"
                        dropdownClassName="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-xl shadow-lg z-50"
                        aria-label="End Date"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* slightly left-shifted priority so its dropdown opens safely */}
                <div className="mr-20 flex items-center gap-3 relative z-[60]">
                  <PriorityBadge
                    value={bug?.priority}
                    level={bug?.priority || "High"}
                    onChange={(val) =>
                      updateBug((p) => ({ ...(p || {}), priority: val }))
                    }
                    /* keep priority dropdown z lower than assign's to avoid overlap issues */
                    dropdownClassName="absolute right-0 mt-2 w-40 bg-[#2a2a2a] rounded-xl shadow-lg z-50"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tags */}
          <div className="mt-6 slide-in">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-gray-300 text-base font-semibold animated-label">
                Tags
              </p>
            </div>

            {/* kept original bg class but also added tags-container so CSS overrides appear */}
            <div className="bg-[#1a1a1a] p-4 rounded-xl tags-container">
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, i) => {
                  const colors = [
                    "bg-[#256d5a] text-white",
                    "bg-[#873234] text-white",
                    "bg-[#563873] text-white",
                    "bg-[#244c73] text-white",
                    "bg-[#31584a] text-white",
                    "bg-[#8b3a63] text-white",
                    "bg-[#78422a] text-white",
                    "bg-[#8c7530] text-white",
                    "bg-[#4a3b73] text-white",
                    "bg-[#2d4687] text-white",
                  ];
                  const colorClass = colors[i % colors.length];

                  return (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className={`${colorClass} px-3 py-1.5 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer transition`}
                    >
                      {tag}
                      <motion.button
                        whileHover={{ rotate: 90, scale: 1.2 }}
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-xs text-white hover:text-gray-200"
                      >
                        ✕
                      </motion.button>
                    </motion.span>
                  );
                })}
              </div>

              <motion.input
                type="text"
                placeholder="Search or Create New"
                onKeyDown={addTag}
                className="w-60 focus:w-96 transition-all duration-300 bg-[#2a2a2a] outline-none text-sm text-gray-200 placeholder-gray-500 p-2 rounded-md focus:ring-1 focus:ring-purple-500"
                whileFocus={{ scale: 1.02 }}
              />
            </div>

            {tagError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs mt-2"
              >
                {tagError}
              </motion.p>
            )}
          </div>

          {/* 🔹 Description with Quill */}
          <div className="mt-6 slide-in">
            <div className="flex items-center gap-2 mb-2">
              <DescriptionIcon size={18} className="text-gray-400" />
              <p className="text-gray-300 text-base font-semibold animated-label">
                Description
              </p>
            </div>

            <motion.div
              className={`editor-card mb-4 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out ${
                isFocused ? "ring-2 ring-indigo-500" : ""
              } hover-glow`}
              whileHover={{
                boxShadow: "0 0 22px rgba(99,102,241,0.12)",
                y: -2,
              }}
            >
              <div className="flex-1 max-h-72 overflow-y-auto custom-scroll">
                <ReactQuill
                  theme="snow"
                  value={description}
                  onChange={(html) => {
                    setDescription(html);
                    updateBug((p) => ({ ...(p || {}), description: html }));
                    setWordCount(messageWordCount(html));
                    
                    // Force immediate localStorage save for description
                    const updatedBug = { ...bug, description: html };
                    localStorage.setItem("selectedBug", JSON.stringify(updatedBug));
                  }}
                  modules={quillModules}
                  placeholder="Enter bug description... (use formatting tools above)"
                  className="bg-transparent"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </div>

              {/* Counter */}
              <div className="flex justify-between px-3 py-2 bg-[#0f0f0f] border-t border-zinc-800">
                <div className="text-sm text-gray-500">
                  Formatting: bold, italic, lists, links
                </div>
                <span
                  className={`text-sm ${
                    wordCount > 800
                      ? "text-red-500"
                      : wordCount > 500
                      ? "text-indigo-400"
                      : "text-zinc-400"
                  }`}
                >
                  {wordCount}/1000
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#111] h-2 mt-1 rounded-full overflow-hidden">
                <div
                  className={`progress-bar ${
                    wordCount > 900
                      ? "critical"
                      : wordCount > 600
                      ? "fast shimmer"
                      : "shimmer"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </motion.div>
          </div>

          {/* ===================================== */}
          {/* 🔹 Bug Attachments Section */}
          <div className="mt-6 slide-in">
            <p className="text-gray-300 text-base font-semibold mb-4">
              Attachments
            </p>
            
            {/* File Upload Component */}
            <FileUploader
              bugId={bug?._id}
              onFileUploaded={handleFileUploaded}
              className="mb-6"
            />
            
            {/* File List Component */}
            <BugAttachmentsList
              bugId={bug?._id}
              refreshTrigger={attachmentsRefreshTrigger}
              className="mt-4"
            />
          </div>

          {/* small bottom padding so content doesn't hide under the progress bar */}
          <div style={{ height: 20 }} />
        </motion.div>

        {/* Right Panel - Comments (use imported Comments component) */}
        <div className="right-panel flex-[0.3] border-l border-gray-800 bg-[#0f0f10]">
          <Comments bug={bug} updateBug={updateBug} />
        </div>

        {/* Scroll progress track spanning both panels (bottom) */}
        <div className="scroll-progress-track" aria-hidden>
          <div
            className="scroll-progress-bar"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* 🔹 Image Preview Modal (images only) */}
      {previewImageIndex !== null && imageAttachments.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onClick={() => setPreviewImageIndex(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImageIndex(null);
            }}
            aria-label="Close preview"
            title="Close"
          >
            <X size={28} />
          </button>

          <button
            className="absolute left-6 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImageIndex(
                (previewImageIndex - 1 + imageAttachments.length) %
                  imageAttachments.length
              );
            }}
            aria-label="Previous image"
            title="Previous"
          >
            <ChevronLeft size={40} />
          </button>

          <img
            src={imageAttachments[previewImageIndex]?.url}
            alt={imageAttachments[previewImageIndex]?.name || "preview"}
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-6 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImageIndex(
                (previewImageIndex + 1) % imageAttachments.length
              );
            }}
            aria-label="Next image"
            title="Next"
          >
            <ChevronRight size={40} />
          </button>
        </div>
      )}

      {/* Warning Sound */}
      <audio
        ref={audioRef}
        src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
        preload="auto"
      />

      {/* Loading Screen */}
      <LoadingScreen 
        message="Saving changes..." 
        isVisible={isUpdating} 
      />
    </div>
  );
};

export default BugDetails;
