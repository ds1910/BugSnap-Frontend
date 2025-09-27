  // ProfilePopup.jsx
  import React, { useState, useEffect } from "react";
  import {
    X,
    Search,
    Circle,
    CheckCircle2,
    Loader2,
    Bug,
    Copy,
    ChevronDown,
    Filter,
    Users,
  } from "lucide-react";
  import clsx from "clsx";
  import { motion, AnimatePresence } from "framer-motion";

  const statusOptions = [
    { value: "all", label: "All", icon: <Filter size={14} className="text-blue-400" /> },
    { value: "todo", label: "To Do", icon: <Circle size={14} className="text-blue-400" /> },
    { value: "inprogress", label: "In Progress", icon: <Loader2 size={14} className="text-yellow-400" /> },
    { value: "resolved", label: "Resolved", icon: <CheckCircle2 size={14} className="text-green-400" /> },
    { value: "closed", label: "Closed", icon: <Bug size={14} className="text-gray-400" /> },
  ];

  const ProfilePopup = ({ person = {}, bugs = [], onClose }) => {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [bugData, setBugData] = useState([]);

    // 🔹 Fetch bug data from backend (or fallback to props/dummy)
    useEffect(() => {
      const fetchBugs = async () => {
        try {
          // Replace with real API endpoint later
          // Example: const res = await fetch(`/api/bugs?assignee=${person.id}`);
          // const data = await res.json();
          const data = bugs; // fallback from props
          setBugData(data);
        } catch (err) {
          console.error("Failed to fetch bugs:", err);
          setBugData(bugs || []);
        } finally {
          setLoading(false);
        }
      };

      fetchBugs();
    }, [person.id, bugs]);

    // Group bugs by status
    const bugStats = {
      todo: bugData.filter((b) => b.status === "todo"),
      inprogress: bugData.filter((b) => b.status === "inprogress"),
      resolved: bugData.filter((b) => b.status === "resolved"),
      closed: bugData.filter((b) => b.status === "closed"),
    };

    // Filtered list
    const filteredBugs = bugData.filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) &&
        (filter === "all" || b.status === filter)
    );

    // Copy email
    const handleCopyEmail = () => {
      if (person.email) navigator.clipboard.writeText(person.email);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
        {/* NOTE: min-h prevents the modal from shrinking when there are no bugs.
            overflow-visible prevents the dropdown from being clipped. */}
        <div className="bg-zinc-900 w-[700px] min-h-[520px] max-h-[90vh] rounded-2xl shadow-lg border border-zinc-700 overflow-visible flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-xl font-semibold text-white shadow-lg">
                {(person.name || "U").charAt(0)}
                <span
                  className={clsx(
                    "absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-zinc-900",
                    person.online ? "bg-green-500" : "bg-gray-500"
                  )}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{person.name || "Unknown"}</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <p>{person.email || "—"}</p>
                  <button
                    onClick={handleCopyEmail}
                    className="hover:text-white transition"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Bug stats */}
          <div className="grid grid-cols-4 gap-4 p-4 border-b border-zinc-700 text-center">
            <div className="hover:bg-zinc-800 p-2 rounded-lg transition">
              <p className="text-sm text-gray-400">To Do</p>
              <p className="text-lg font-bold text-blue-400">
                {bugStats.todo.length}
              </p>
            </div>
            <div className="hover:bg-zinc-800 p-2 rounded-lg transition">
              <p className="text-sm text-gray-400">In Progress</p>
              <p className="text-lg font-bold text-yellow-400">
                {bugStats.inprogress.length}
              </p>
            </div>
            <div className="hover:bg-zinc-800 p-2 rounded-lg transition">
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="text-lg font-bold text-green-400">
                {bugStats.resolved.length}
              </p>
            </div>
            <div className="hover:bg-zinc-800 p-2 rounded-lg transition">
              <p className="text-sm text-gray-400">Closed</p>
              <p className="text-lg font-bold text-gray-300">
                {bugStats.closed.length}
              </p>
            </div>
          </div>

          {/* Teams */}
          <div className="px-4 py-3 border-b border-zinc-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Users size={16} className="text-blue-400" /> Teams
            </h3>
            <div className="flex flex-wrap gap-2">
              {(person.teams || []).map((team, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-gray-200 
                            border border-zinc-700 hover:border-blue-400 hover:text-white hover:scale-[1.05]
                            transition cursor-pointer shadow-sm"
                >
                  <Users size={12} className="text-purple-400" />
                  {team}
                </span>
              ))}
            </div>
          </div>

          {/* Search + Custom Dropdown Filter */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700 relative">
            <Search className="text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search bugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-500"
            />

            {/* Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 hover:border-blue-400 hover:text-white transition"
              >
                {statusOptions.find((o) => o.value === filter)?.icon}
                <span>{statusOptions.find((o) => o.value === filter)?.label}</span>
                <ChevronDown
                  size={14}
                  className={clsx(
                    "transition-transform ml-1",
                    filterOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilter(option.value);
                          setFilterOpen(false);
                        }}
                        className={clsx(
                          "flex items-center gap-2 w-full px-3 py-2 text-sm transition text-gray-300 hover:text-white hover:bg-zinc-700",
                          filter === option.value && "bg-zinc-700/60 text-white"
                        )}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bug list */}
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {loading ? (
              <p className="text-gray-400 text-sm text-center">Loading...</p>
            ) : filteredBugs.length > 0 ? (
              filteredBugs.map((bug) => (
                <div
                  key={bug.id}
                  className="flex items-center justify-between bg-zinc-800 p-3 rounded-xl border border-zinc-700 hover:border-blue-400 transition"
                >
                  <div className="flex items-center gap-3">
                    {bug.status === "todo" && (
                      <Circle size={18} className="text-blue-400" />
                    )}
                    {bug.status === "inprogress" && (
                      <Loader2
                        size={18}
                        className="text-yellow-400 animate-spin"
                      />
                    )}
                    {bug.status === "resolved" && (
                      <CheckCircle2 size={18} className="text-green-400" />
                    )}
                    {bug.status === "closed" && (
                      <Bug size={18} className="text-gray-400" />
                    )}
                    <span className="text-white">{bug.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{bug.status}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">No bugs found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default ProfilePopup;
