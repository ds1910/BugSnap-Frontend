// InvitePopup.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

/**
 * Invite Popup
 *
 * Pattern used:
 * - Always call backend (POST /people/add) to perform invites (server is source of truth).
 * - After backend success, notify parent via callbacks (non-blocking notifications):
 *    - onSendInvites (new-style, optional)
 *    - onInvitesSent (optional)
 *    - onInvite (legacy, optional; receives comma-joined string)
 * - On failure, call onInviteError (optional notification).
 *
 * Note: callbacks are notifications only and do not replace backend work.
 */

// --- Dummy suggestions (replace with real API data if needed) ---
const DEFAULT_SUGGESTIONS = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", avatar: "https://i.pravatar.cc/150?img=2" },
  { id: 3, name: "Carol Lee", email: "carol@example.com", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: 4, name: "Dinesh Kumar", email: "dinesh@company.com", avatar: "https://i.pravatar.cc/150?img=4" },
];

// --- Helpers ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const splitTokens = (text) =>
  text
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

// --- EmailChip (with follow-cursor tooltip) ---
const EmailChip = ({ u, onRemove }) => {
  const [tip, setTip] = useState({ show: false, x: 0, y: 0 });
  return (
    <span
      className={`relative flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-default ${
        validateEmail(u.email) ? "bg-blue-600 text-white" : "bg-red-500/80 text-white"
      }`}
      onMouseEnter={() => setTip((t) => ({ ...t, show: true }))}
      onMouseLeave={() => setTip({ show: false, x: 0, y: 0 })}
      onMouseMove={(e) => setTip({ show: true, x: e.clientX + 12, y: e.clientY + 12 })}
    >
      {u.avatar ? (
        <img src={u.avatar} alt={u.name || u.email} className="w-5 h-5 rounded-full" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">
          {u.email[0]?.toUpperCase()}
        </div>
      )}
      <span className="truncate max-w-[140px]">
        {u.name ? `${u.name} ` : ""}
        <span className="opacity-80">{u.email}</span>
      </span>
      <X size={14} className="cursor-pointer hover:text-gray-200" onClick={() => onRemove(u.email)} />

      {tip.show && (
        <div
          className="fixed z-50 bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
          style={{ top: tip.y, left: tip.x }}
        >
          <div className="flex items-center gap-2">
            {u.avatar ? (
              <img src={u.avatar} alt={u.name || u.email} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">
                {u.email[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex flex-col text-left">
              {u.name && <span className="font-medium">{u.name}</span>}
              <span className="text-gray-300">{u.email}</span>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

// --- Main Component ---
export default function InvitePopup({
  onClose,
  /** new API: (emails: string[], serverResponse?) => Promise<any> (optional notification) */
  onSendInvites,
  /** optional: preload suggestions */
  suggestions = DEFAULT_SUGGESTIONS,
  /** new API: called after success with array and server response (optional) */
  onInvitesSent,
  /** legacy: onInvite(emailsString, serverResponse?) (optional) */
  onInvite,
  /** legacy: onInviteError(errMsg) (optional) */
  onInviteError,
}) {
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [toast, setToast] = useState(null); // { message, type }

  const inputRef = useRef(null);
  const listboxRef = useRef(null);

  // Filter suggestions
  const filtered = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.toLowerCase();
    return suggestions.filter(
      (s) =>
        (s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
        !users.some((u) => u.email === s.email)
    );
  }, [input, suggestions, users]);

  const addFromText = (text) => {
    const tokens = splitTokens(text);
    if (!tokens.length) return;
    const newOnes = tokens
      .filter((email) => !users.some((u) => u.email === email))
      .map((email) => ({ email, name: null, avatar: null }));
    if (newOnes.length) setUsers((prev) => [...prev, ...newOnes]);
  };

  const handleKeyDown = (e) => {
    // If suggestion is open and an item selected, let Enter / Tab add that suggestion first
    if (filtered.length && (e.key === "Enter" || e.key === "Tab")) {
      if (activeIdx >= 0) {
        e.preventDefault();
        addUser(filtered[activeIdx]);
        return;
      }
    }

    // separators (Enter when no active suggestion, Tab, comma, semicolon, space)
    if (["Tab", ",", ";", " "].includes(e.key) || (e.key === "Enter" && !filtered.length)) {
      if (input.trim()) {
        e.preventDefault();
        addFromText(input);
        setInput("");
        setActiveIdx(-1);
      }
      return;
    }

    if (filtered.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
      }
    }

    if (e.key === "Backspace" && !input) {
      setUsers((prev) => prev.slice(0, -1));
    }
  };

  const addUser = (u) => {
    // `u` may be a suggestion object or a plain { email } object
    const email = u.email?.trim?.() ?? String(u).trim();
    if (!email) return;
    setUsers((prev) => (prev.some((x) => x.email === email) ? prev : [...prev, { email, name: u.name ?? null, avatar: u.avatar ?? null }]));
    setInput("");
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const removeUser = (email) => setUsers((prev) => prev.filter((u) => u.email !== email));

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // show toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- Backend integration (always call backend) ---
  const sendInvites = async (emails) => {
    // validate that we got an array of emails
    if (!Array.isArray(emails)) {
      throw new Error("sendInvites expects an array of emails");
    }

    const normalized = emails.map((e) => (e == null ? "" : String(e).trim())).filter(Boolean);
    if (normalized.length === 0) {
      throw new Error("No valid emails provided");
    }

    if (!backendUrl) {
      throw new Error("Missing backend URL (VITE_BACKEND_URL).");
    }

    const endpoint = `${backendUrl.replace(/\/$/, "")}/people/invite`;
    const axiosOpts = { withCredentials: true, timeout: 15000, headers: { "Content-Type": "application/json" } };

    try {
      console.log("Calling backend API:", endpoint, normalized);
      // Use POST as authoritative; change to PATCH if your backend expects PATCH
      const response = await axios.post(endpoint, { emails: normalized }, axiosOpts);

      console.log("API response status:", response?.status);
      if (response?.status >= 200 && response?.status < 300) {
        return response.data; // expected { message: "...", ... }
      }

      throw new Error(response?.data?.message || `Request failed with status ${response?.status}`);
    } catch (err) {
      console.error("sendInvites API error:", err?.response ?? err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send invites";
      throw new Error(msg);
    }
  };

  const handleSend = async () => {
    if (!users.length) {
      const msg = "Please enter at least one email.";
      setError(msg);
      triggerShake();
      try { if (typeof onInviteError === "function") onInviteError(msg); } catch (e) { console.warn(e); }
      showToast(msg, "error");
      return;
    }

    const invalids = users.filter((u) => !validateEmail(u.email)).map((u) => u.email);
    if (invalids.length) {
      const msg = `Invalid emails: ${invalids.join(", ")}`;
      setError(msg);
      triggerShake();
      try { if (typeof onInviteError === "function") onInviteError(msg); } catch (e) { console.warn(e); }
      showToast(msg, "error");
      return;
    }

    setError("");
    setLoading(true);
    const emails = users.map((u) => u.email);

    try {
      // Always call the backend to actually send invites/create users.
      const res = await sendInvites(emails);

      // Notify parent callbacks (non-blocking). Pass server response as second arg.
      // We deliberately do NOT await these (they are notifications only).
      if (typeof onSendInvites === "function") {
        Promise.resolve()
          .then(() => onSendInvites(emails, res))
          .catch((err) => console.warn("onSendInvites error:", err));
      }

      if (typeof onInvitesSent === "function") {
        Promise.resolve()
          .then(() => onInvitesSent(emails, res))
          .catch((err) => console.warn("onInvitesSent error:", err));
      }

      if (typeof onInvite === "function") {
        const legacyArg = emails.join(", ");
        Promise.resolve()
          .then(() => onInvite(legacyArg, res))
          .catch((err) => console.warn("onInvite (legacy) error:", err));
      }

      // show success toast (prefer server-provided message)
      const serverMsg = res?.message || "Invites sent successfully!";
      showToast(serverMsg, "success");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setUsers([]);
        setInput("");
        onClose?.();
      }, 1500);
    } catch (e) {
      const msg = e?.message || "Something went wrong while sending invites.";
      setError(msg);
      triggerShake();
      try { if (typeof onInviteError === "function") onInviteError(msg); } catch (err) { console.warn(err); }
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (text && /[,;\s\n]/.test(text)) {
      e.preventDefault();
      addFromText(text);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!listboxRef.current) return;
      if (!listboxRef.current.contains(e.target) && e.target !== inputRef.current) {
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/60"
          onClick={() => (!loading && !success ? onClose?.() : null)}
        />
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <AnimatePresence>
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="bg-[#1E1E2F] text-white w-full max-w-[520px] rounded-2xl shadow-2xl p-6 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
          >
            {!success && !loading && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}

            {success ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle2 size={52} className="text-green-500 mb-3" />
                <p className="text-lg font-medium">Invites sent successfully!</p>
                <p className="text-xs text-gray-400 mt-1">Users will be auto-added when they accept via email link.</p>
              </div>
            ) : (
              <>
                <h2 id="invite-title" className="text-xl font-semibold mb-1">
                  Invite People
                </h2>
                <p className="text-gray-400 text-sm mb-5">
                  Enter emails to invite. We’ll email them an accept link; once they accept, they’ll be added automatically.
                </p>

                <motion.div
                  animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border min-h-[56px] transition relative ${
                    error
                      ? "border-red-500 bg-[#2A1F1F]"
                      : "border-transparent bg-[#2A2A40] focus-within:border-blue-500"
                  }`}
                >
                  <Mail className={`${error ? "text-red-400" : "text-gray-400"} mt-1`} size={18} />

                  <div className="flex flex-wrap gap-2 flex-1">
                    {users.map((u) => (
                      <EmailChip key={u.email} u={u} onRemove={removeUser} />
                    ))}

                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setActiveIdx(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      onPaste={onPaste}
                      placeholder={users.length === 0 ? "Enter email…" : ""}
                      className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                      disabled={loading}
                      aria-autocomplete="list"
                      aria-expanded={filtered.length > 0}
                      aria-controls="invite-suggestions"
                    />
                  </div>

                  {filtered.length > 0 && (
                    <div
                      ref={listboxRef}
                      id="invite-suggestions"
                      role="listbox"
                      className="absolute left-0 top-[110%] w-full bg-[#2A2A40] rounded-xl shadow-lg border border-gray-700 z-20 max-h-60 overflow-y-auto"
                    >
                      {filtered.map((s, idx) => (
                        <div
                          key={s.email}
                          role="option"
                          aria-selected={activeIdx === idx}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addUser(s)}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition text-sm ${
                            activeIdx === idx ? "bg-[#454566]" : "hover:bg-[#3A3A55]"
                          }`}
                        >
                          <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full" />
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{s.name}</span>
                            <span className="text-xs text-gray-400">{s.email}</span>
                          </div>
                          <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                            <UserPlus size={14} /> Add
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {error && (
                  <p className="flex items-center gap-1 mt-2 text-xs text-red-400">
                    <AlertCircle size={14} /> {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-[#2A2A40] text-gray-300 hover:bg-[#3A3A55] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Send Invite
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white shadow-lg flex items-center gap-3 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 /> : <AlertCircle />}
          <div className="text-sm">{toast.message}</div>
        </div>
      )}
    </div>
  );
}
