// Message.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  CheckCircle2,
  Link as LinkIcon,
  Paperclip,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

/**
 * Message component — merged polished composer (small UX fixes)
 *
 * Kept all previous logic. Visual/DOM tweaks:
 * - smaller modal (max-w-2xl)
 * - modal content max-height + scroll
 * - quill editor fixed-height with internal scrolling
 * - moved file input OUT of clickable label to avoid double-open bug
 * - improved floating-label background so it doesn't "stick" to border
 *
 * Props:
 *  - person: { name, email, avatarUrl? }
 *  - onClose: () => void
 *  - onSend: async ({ email, subject, messageHtml, attachments: File[] }) => {}
 */

// constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function Message({
  person = { name: "Dinesh Sharma", email: "2023ITB015@example.com" },
  onClose = () => {},
  onSend = async () => {},
}) {
  // form state
  const [subject, setSubject] = useState("");
  const [subjectFocused, setSubjectFocused] = useState(false);
  const [messageHtml, setMessageHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // attachments: array of { file: File, url: objectURL }
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // link previews: array of { url, title, description }
  const [previews, setPreviews] = useState([]);

  // lightbox gallery index (null = closed)
  const [previewIndex, setPreviewIndex] = useState(null);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Quill toolbar modules
  const quillModules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  // Helpers
  const isImageFile = (f) => f?.type?.startsWith?.("image/");

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const valid = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        setError(`${f.name} is larger than 10MB and was not added.`);
        continue;
      }
      const url = URL.createObjectURL(f);
      valid.push({ file: f, url });
    }
    if (valid.length) {
      setAttachments((prev) => [...prev, ...valid]);
      setError("");
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  // Extract URLs from quill html
  const extractUrlsFromHtml = (html) => {
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const found = new Set();
    let m;
    while ((m = hrefRegex.exec(html))) found.add(m[1]);
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/gi;
    while ((m = urlRegex.exec(html))) found.add(m[1]);
    return Array.from(found);
  };

  // Fetch preview metadata (backend expected at /api/preview)
  const fetchPreview = async (url) => {
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("no preview");
      const json = await res.json();
      return {
        url,
        title: json.title || url,
        description: json.description || "",
        ...(json.image ? { image: json.image } : {}),
      };
    } catch {
      try {
        const u = new URL(url);
        return { url, title: u.hostname, description: url };
      } catch {
        return { url, title: url, description: "" };
      }
    }
  };

  // Update previews when message changes
  useEffect(() => {
    const urls = extractUrlsFromHtml(messageHtml);
    if (!urls.length) {
      setPreviews([]);
      return;
    }
    let mounted = true;
    (async () => {
      const p = await Promise.all(urls.map((u) => fetchPreview(u)));
      if (mounted) setPreviews(p);
    })();
    return () => {
      mounted = false;
    };
  }, [messageHtml]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (previewIndex === null) return;
    const handler = (e) => {
      if (e.key === "Escape") setPreviewIndex(null);
      else if (e.key === "ArrowRight" && previewIndex < attachments.length - 1)
        setPreviewIndex((i) => i + 1);
      else if (e.key === "ArrowLeft" && previewIndex > 0)
        setPreviewIndex((i) => i - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewIndex, attachments.length]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((a) => a.url && URL.revokeObjectURL(a.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send
  const handleSend = async () => {
    if (!subject.trim()) {
      setError("Please add a subject.");
      return;
    }
    if (!messageHtml.trim()) {
      setError("Please write a message.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const files = attachments.map((a) => a.file);
      await onSend({
        email: person.email,
        subject,
        messageHtml,
        attachments: files,
      });
      // success UX
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setLoading(false);
        onClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Failed to send message");
    }
  };

  // Message plain length helper
  const messagePlainLength = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent?.trim().length || 0;
  };

  // Inject CSS for Quill + placeholders + improved appearance (component-scoped)
  useEffect(() => {
    const id = "message-component-styles";
    if (document.getElementById(id)) return;
    const css = `
/* Quill toolbar / editor adjustments */
.ql-toolbar.ql-snow { background: transparent; border: none; padding: 8px 12px; }
.ql-container.ql-snow { border: none; background: transparent; }
.ql-editor {
  min-height: 140px;
  max-height: 220px;    /* <-- fixed max height for body with internal scroll */
  overflow-y: auto;     /* <-- internal scroll */
  padding: 14px;
  color: #E6EEF6;
  background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005));
  font-size: 15px;
  line-height: 1.5;
  border-radius: 0 0 8px 8px;
  outline: none;
}
/* placeholder color fix - visible in dark theme */
.ql-editor.ql-blank::before { color: #94a3b8; }
/* toolbar icon color */
.ql-toolbar .ql-stroke { stroke: #cbd5e1; }
.ql-toolbar .ql-picker-label, .ql-toolbar .ql-picker-item { color: #cbd5e1; }
.ql-toolbar .ql-formats button:hover, .ql-toolbar .ql-formats button:focus {
  background: rgba(255,255,255,0.03); border-radius: 6px;
}

/* Floating label for subject */
/* Give the floating label a background matching the modal so it doesn't 'stick' to border */
.floating-input { position: relative; }
.floating-input input {
  background: linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01));
  border: 1px solid rgba(148,163,184,0.08);
  padding: 18px 12px 10px 12px;
  border-radius: 10px;
  color: #e6eef6;
  width: 100%;
  outline: none;
  transition: box-shadow .18s ease, transform .12s ease, border-color .12s ease;
  font-size: 15px;
}
.floating-input input:focus { box-shadow: 0 6px 18px rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.85); }
/* set label background same as modal and give padding to visually separate from border */
.floating-input label {
  position: absolute; left: 12px; top: 14px; font-size: 13px; color: #94a3b8;
  pointer-events: none; transform-origin: left top;
  transition: transform .12s ease, top .12s ease, font-size .12s ease, color .12s ease;
  background: #0f1724; padding: 0 6px; border-radius: 4px;
}
.floating-input.focused label, .floating-input.has-value label {
  transform: translateY(-12px) scale(0.88); top: 6px; color: rgba(99,102,241,0.95);
}

/* editor card */
.editor-card { border-radius: 10px; overflow: hidden; border: 1px solid rgba(148,163,184,0.08); box-shadow: 0 6px 18px rgba(2,6,23,0.6); }

/* attachment thumbnail */
.attachment-thumb { width: 64px; height: 48px; object-fit: cover; border-radius: 6px; }

/* small helpers */
.small-muted { color: #94a3b8; font-size: 12px; }
.counter { font-size: 12px; color: #94a3b8; }

/* send button gradient */
.send-btn { background: linear-gradient(90deg,#6d28d9,#7c3aed); box-shadow: 0 6px 18px rgba(124,58,237,0.18); }
.send-btn:hover { transform: translateY(-1px); }

/* lightbox scale */
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96);} to { opacity: 1; transform: scale(1);} }
.animate-scaleIn { animation: scaleIn .18s ease-out; }
`;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Backdrop */}
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/60"
          onClick={() => {
            if (!loading) onClose();
          }}
        />
      </AnimatePresence>

      {/* Modal (smaller width + bounded height with scroll) */}
      <AnimatePresence>
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div
            ref={modalRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            // constrain modal height and allow inner scroll
            className={`bg-[#0f1724] border border-zinc-700 rounded-2xl shadow-2xl p-6 text-white transition-all max-h-[80vh] overflow-auto ${
              dragActive ? "ring-2 ring-indigo-500" : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Send Message</h3>
                <p className="text-sm text-gray-400">
                  Your message will be sent to the recipient via email. They
                  will be added automatically when they accept the invite (if
                  applicable).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <button
                  onClick={() => {
                    if (!loading) onClose();
                  }}
                  aria-label="Close"
                  className="text-gray-400 hover:text-white p-2 rounded-md transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Recipient */}
            <div className="flex items-center gap-3 mt-4 mb-4 p-3 rounded-lg bg-[#111827] border border-zinc-700">
              {person?.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {person?.name?.[0] ?? person?.email?.[0] ?? "U"}
                </div>
              )}
              <div>
                <div className="font-medium">{person?.name}</div>
                <div className="text-xs text-gray-400">{person?.email}</div>
              </div>
            </div>

            {/* Subject (floating label) */}
            <div
              className={`floating-input mb-4 ${
                subjectFocused || subject ? "focused has-value" : ""
              }`}
            >
              <label>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setSubjectFocused(true)}
                onBlur={() => setSubjectFocused(false)}
                placeholder=" "
                className="bg-transparent"
                disabled={loading || sent}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="small-muted">Give the message a short title</div>
                <div className="counter">{subject.length} chars</div>
              </div>
            </div>

            {/* WYSIWYG - editor card */}
            <label className="block text-sm text-gray-300 mb-2">Message</label>
            <div className="editor-card mb-4">
              <ReactQuill
                theme="snow"
                value={messageHtml}
                onChange={setMessageHtml}
                modules={quillModules}
                placeholder="Write your message... (format with bold, lists, links)"
                readOnly={loading || sent}
                className="bg-transparent"
              />
              <div className="flex items-center justify-between px-3 py-2 bg-[#07121b] border-t border-zinc-700">
                <div className="small-muted">Formatting: bold, italic, lists, links</div>
                <div className="counter">{messagePlainLength(messageHtml)} chars</div>
              </div>
            </div>

            {/* Link previews */}
            {previews.length > 0 && (
              <div className="mb-4 space-y-2">
                {previews.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 rounded-lg bg-[#081023] border border-zinc-700 hover:border-indigo-500 transition group"
                  >
                    <div className="flex items-start gap-3">
                      <LinkIcon size={18} className="text-indigo-400 mt-1" />
                      <div>
                        <div className="font-medium text-white group-hover:text-indigo-400">
                          {p.title}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[60ch]">
                          {p.description}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Attachments */}
            {/* NOTE: input moved outside the "label" clickable area to avoid double file-dialog open */}
            <div className="mb-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                className={`flex items-center gap-3 px-3 py-3 border border-dashed rounded-lg cursor-pointer hover:border-indigo-500 transition ${
                  dragActive ? "bg-indigo-500/6 border-indigo-500" : ""
                }`}
              >
                <Paperclip size={18} className="text-gray-300" />
                <div className="text-sm text-gray-300">
                  {dragActive ? "Drop files here..." : "Attach files (click or drag here). Max 10MB each."}
                </div>
              </div>

              {/* actual input (outside) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
                disabled={loading || sent}
              />

              {/* preview chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((a, i) => {
                  const f = a.file;
                  const isImage = isImageFile(f);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-[#071223] border border-zinc-700 rounded-lg px-3 py-2">
                      {isImage ? (
                        <img src={a.url} alt={f.name} className="attachment-thumb cursor-pointer" onClick={() => setPreviewIndex(i)} />
                      ) : (
                        <div className="w-12 h-10 rounded bg-[#071827] flex items-center justify-center">
                          <FileText size={18} className="text-indigo-400" />
                        </div>
                      )}
                      <div className="flex flex-col max-w-[200px]">
                        <div className="text-sm text-white truncate">{f.name}</div>
                        <div className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button className="ml-2 text-gray-400 hover:text-red-400" onClick={() => removeAttachment(i)} disabled={loading} aria-label={`Remove ${f.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* error */}
            {error && <div className="text-sm text-red-400 mb-3">{error}</div>}

            {/* actions */}
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { if (!loading) onClose(); }} className="px-4 py-2 bg-[#071326] border border-zinc-700 text-gray-300 rounded-lg hover:bg-[#0b1724] transition" disabled={loading}>
                Cancel
              </button>

              <button onClick={handleSend} disabled={loading || sent} className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium send-btn disabled:opacity-50" aria-label="Send message">
                {loading ? <Loader2 className="animate-spin" size={16} /> : sent ? <><CheckCircle2 size={16} /> Sent</> : <><Send size={16} /> Send</>}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Lightbox gallery (images only) */}
      <AnimatePresence>
        {previewIndex !== null && attachments[previewIndex] && isImageFile(attachments[previewIndex].file) && (
          <motion.div className="fixed inset-0 z-[3000] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewIndex(null)} />

            <div className="relative z-20 flex items-center gap-4">
              {previewIndex > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setPreviewIndex((i) => i - 1); }} className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/60 p-3 rounded-full hover:bg-black/80">
                  <ChevronLeft size={28} className="text-white" />
                </button>
              )}

              <motion.img key={attachments[previewIndex].url} src={attachments[previewIndex].url} alt={attachments[previewIndex].file.name} onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }} className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-lg animate-scaleIn" />

              {previewIndex < attachments.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setPreviewIndex((i) => i + 1); }} className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/60 p-3 rounded-full hover:bg-black/80">
                  <ChevronRight size={28} className="text-white" />
                </button>
              )}

              <button onClick={() => setPreviewIndex(null)} className="absolute right-6 top-6 bg-black/60 p-2 rounded-full hover:bg-black/80">
                <X size={18} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
