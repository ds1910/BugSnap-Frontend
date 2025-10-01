import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DropdownIcon from "../UI/DropdownIcon";
import StatusBadge from "../UI/StatusBadge";
import BugRow from "./BugRow";
import { CornerDownLeft, Trash2, X } from "lucide-react";
import CalendarDropdown from "../UI/CalendarDropdown";
import PriorityBadge from "../UI/PriorityBadge";
import AssignBugBadge from "../UI/AssignBugBadge";
import axios from "axios";
import BugDetail from "../Bug_Info_Page/BugDetail";
import { useSearchFilter } from "./SearchFilterContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

/* ----------------- Small Toast (same style) ----------------- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[9999] 
        transform transition-all duration-500 ease-in-out animate-slideIn
        ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white"
            : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400 text-white"
        }`}
    >
      {type === "success" ? (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}

      <span className="text-sm font-medium">{message}</span>

      <button onClick={onClose} className="ml-3 text-white/70 hover:text-white transition">
        ✕
      </button>
    </div>
  );
};

const BugSection = ({ activeTeam, status }) => {
  const navigate = useNavigate();
  const { filterBugs, sortBugs } = useSearchFilter();

  const [allBugs, setAllBugs] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bugToDelete, setBugToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 🔹 Listen for localStorage changes (other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedTeamRaw = localStorage.getItem("activeTeam");
      const updatedTeam = updatedTeamRaw ? JSON.parse(updatedTeamRaw) : null;
      if (
        (!activeTeam && updatedTeam) ||
        (activeTeam && updatedTeam && activeTeam._id !== updatedTeam._id)
      ) {
        window.location.reload(); // re-render page when team changes in another tab
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [activeTeam]);

  // 🔹 Fetch bugs whenever team changes
  useEffect(() => {
    if (!activeTeam) return;
    axios
      .get(`${backendUrl}/bug/all`, {
        params: { teamId: activeTeam._id },
        withCredentials: true,
      })
      .then((response) => {
        setAllBugs(response.data);
       // console.log(response.data);
      //  showToast("Bugs loaded", "success");
      })
      .catch((error) => {
        console.error("Error fetching bugs:", error);
        showToast("Failed to fetch bugs (showing cached/local)", "error");
      });
  }, [activeTeam]);

  const [isExpanded, setIsExpanded] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [draftTask, setDraftTask] = useState({
    id: null,
    name: "",
    assignee: null,
    dueDate: "",
    priority: "",
    status: "",
    comments: 0,
  });
  const [isDraftVisible, setIsDraftVisible] = useState(false);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const addTask = () => {
    setDraftTask({
      id: Date.now(),
      name: "",
      assignee: "",
      dueDate: "TBD",
      priority: "",
      status: status,
      comments: 0,
    });
    setIsDraftVisible(true);
  };

  // Helper to extract a usable assignee string
  const getAssigneeValue = (a, fallback) => {
    if (a == null) return fallback ?? "Unassigned";
    if (typeof a === "string") return a;
    if (typeof a === "object") return a.name ?? a.username ?? fallback ?? "Unassigned";
    return String(a);
  };

  const normalizeReturnedBug = (rawBug, fallbackAssignee) => {
    if (!rawBug) return null;
    const assignee = getAssigneeValue(rawBug.assignee, fallbackAssignee);
    return { ...rawBug, assignee };
  };

  const saveTask = async () => {
    if (!draftTask || !draftTask.name.trim()) return;

    try {
      const payload = {
        title: draftTask.name,
        assignee: draftTask.assignee || "Unassigned",
        dueDate: draftTask.dueDate || null,
        priority: (draftTask.priority || "low").toLowerCase(),
        status: (draftTask.status || status || "open").toLowerCase(),
        comments: draftTask.comments || 0,
        teamId: activeTeam?._id,
      };

      const response = await axios.post(`${backendUrl}/bug/create`, payload, {
        withCredentials: true,
      });

      const returned = response?.data?.bug ?? response?.data ?? null;

      const bugToAdd = returned
        ? normalizeReturnedBug(returned, payload.assignee)
        : {
            _id: Date.now(),
            title: payload.title,
            assignee: payload.assignee,
            dueDate: payload.dueDate,
            priority: payload.priority,
            status: payload.status,
            comments: payload.comments,
            teamId: payload.teamId,
          };

      setAllBugs((prev) => {
        if (Array.isArray(prev)) return [...prev, bugToAdd];
        if (prev && Array.isArray(prev.data)) return { ...prev, data: [...prev.data, bugToAdd] };
        if (prev && Array.isArray(prev.bugs)) return { ...prev, bugs: [...prev.bugs, bugToAdd] };
        return [bugToAdd];
      });

      setDraftTask({ assignee: "", name: "" });
      setIsDraftVisible(false);
      showToast("Bug created", "success");
    } catch (error) {
      console.error("❌ Error saving bug:", error);
      setTasks((prev) => [...prev, { ...draftTask, id: Date.now() }]);
      setDraftTask({ assignee: "", name: "" });
      setIsDraftVisible(false);
      showToast("Failed to create bug (saved locally)", "error");
    }
  };

  // 🔹 Delete with modal
  const deleteTask = (id) => {
    const bug = allBugs.find((b) => String(b._id) === String(id) || String(b.id) === String(id));
    if (!bug) {
      setAllBugs((prev) => prev.filter((t) => String(t.id) !== String(id)));
      showToast("Local bug removed", "success");
      return;
    }
    setBugToDelete(bug);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!bugToDelete) return;
    try {
      setDeleting(true);
      const bugIdToSend = bugToDelete._id ?? bugToDelete.id;

      await axios.delete(`${backendUrl}/bug/manage/${bugIdToSend}?teamId=${activeTeam?._id}`, {
        withCredentials: true,
      });

      setAllBugs((prev) =>
        prev.filter((b) => b._id !== bugIdToSend && b.id !== bugIdToSend)
      );
      setShowDeleteModal(false);
      setDeleting(false);
      setBugToDelete(null);
      showToast("Bug deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete bug", "error");
      setDeleting(false);
    }
  };

  const AddBugButton = () => (
    <div
      onClick={addTask}
      className="mt-1 flex items-center justify-center gap-1 rounded-md cursor-pointer 
        transition-colors duration-200 
        bg-[#292929] text-[#9C9C9C]
        hover:bg-[#3A3A3A] hover:text-white select-none"
      style={{ width: "110px", height: "32px", fontFamily: "Inter, sans-serif", fontWeight: "bold", fontSize: "12px" }}
    >
      <span className="text-sm font-bold">+</span>
      <span>Add Bug</span>
    </div>
  );

  const normalize = (s) => String(s ?? "").toLowerCase().replace(/[_\s]+/g, " ").trim();

  const serverList = Array.isArray(allBugs)
    ? allBugs
    : Array.isArray(allBugs?.data)
    ? allBugs.data
    : Array.isArray(allBugs?.bugs)
    ? allBugs.bugs
    : [];

  const wanted = normalize(status);

  // First filter by status (section-specific)
  const filteredServer = serverList.filter((b) => normalize(b?.status) === wanted);
  const filteredLocal = tasks.filter((t) => normalize(t?.status) === wanted);

  const statusFilteredBugs = [...filteredServer, ...filteredLocal];

  // Then apply search and custom filters using context
  const searchAndFilteredBugs = filterBugs(statusFilteredBugs);
  
  // Finally sort the bugs
  const mergedBugs = sortBugs(searchAndFilteredBugs);

  // 🔹 Detail view placeholder
  const BugDetailView = ({ bug }) => {
    useEffect(() => {
      if (bug && bug._id) {
        try {
          localStorage.setItem("selectedBug", JSON.stringify(bug));
        } catch (e) {
          console.error("Could not save bug to localStorage", e);
        }
      }
    }, [bug]);

    return <BugDetail selectedBug={selectedBug} setSelectedBug={setSelectedBug} />;
  };

  return (
    <div className="w-full bg-[#2C2C2C] text-white rounded-md p-4">
      {selectedBug ? (
        <></>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div
              onClick={toggleExpand}
              className={`transform transition-transform duration-300 cursor-pointer ${
                isExpanded ? "rotate -90" : "rotate -0"
              }`}
            >
              <DropdownIcon width={14} height={14} className="text-gray-400" />
            </div>

            <StatusBadge status={status} />

            <span className="text-gray-400 text-sm">{mergedBugs.length}</span>

            <AddBugButton />
          </div>

          {isExpanded && (
            <div className="transition-all duration-300 ease-in-out">
              <div className="gap-30 grid grid-cols-7 border-b border-gray-600 pb-2 text-sm font-medium">
                <div>Name</div>
                <div>Assignee</div>
                <div>Due Date</div>
                <div>Priority</div>
                <div>Status</div>
                <div>Comments</div>
                <div>Actions</div>
              </div>

              {isDraftVisible && (
                <div className="grid grid-cols-7 items-center gap-2 bg-[#3A3A3A] p-2 rounded mt-2 relative">
                  <input
                    type="text"
                    placeholder="Enter Bug title"
                    value={draftTask.name}
                    onChange={(e) => setDraftTask({ ...draftTask, name: e.target.value })}
                    className="bg-transparent border-b border-gray-500 text-white outline-none col-span-1"
                    autoFocus
                  />

                  <div className="flex items-center col-span-6">
                    <div className="ml-0">
                      <AssignBugBadge
                        value={draftTask.assignee}
                        onChange={(val) => setDraftTask((prev) => ({ ...prev, assignee: val }))}
                      />
                    </div>

                    <div className="ml-15 mr-10">
                      <CalendarDropdown
                        value={draftTask.dueDate}
                        onChange={(dateStr) => setDraftTask((prev) => ({ ...prev, dueDate: dateStr }))}
                        bgColor="bg-[#3A3A3A]"
                        hoverBgColor="hover:bg-gray-600"
                      />
                    </div>

                    <div className="ml-2  relative inline-block">
                      <PriorityBadge
                        value={draftTask.priority}
                        onChange={(val) => setDraftTask((prev) => ({ ...prev, priority: val }))}
                      />
                    </div>

                    <div className="ml-18">
                      <StatusBadge status={draftTask.status} />
                    </div>

                    <div
                      onClick={saveTask}
                      className="ml-auto flex items-center gap-2 bg-[#1F51FF] text-white font-semibold px-4 py-2 rounded-xl hover:bg-[#4169E1] cursor-pointer transition"
                    >
                      Save
                      <CornerDownLeft className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )}

              {mergedBugs.map((bug, idx) => {
                const id = bug?._id ?? bug?.id ?? `local-${idx}`;
                const formattedDueDate = bug?.dueDate
                  ? new Date(bug.dueDate).toISOString().split("T")[0]
                  : "";

                // Pass assignedName directly as array for proper multi-user display
                const assigneeDisplay = Array.isArray(bug.assignedName) 
                  ? bug.assignedName 
                  : bug.assignedName 
                    ? [bug.assignedName]
                    : [];

                return (
                  <BugRow
                    key={id}
                    id={id}
                    name={bug.title || bug.name || bug.summary || "Untitled"}
                    assignedName={assigneeDisplay}
                    dueDate={formattedDueDate}
                    priority={bug.priority}
                    status={status}
                    comments={bug.comments}
                    onDelete={deleteTask}
                    openBugDetail={() => {
                      try {
                        if (bug && bug._id) {
                          localStorage.setItem("selectedBug", JSON.stringify(bug));
                          navigate("/bug-details");
                        } else {
                          console.error("Invalid bug data, cannot open details");
                        }
                      } catch (e) {
                        console.error("Could not save to localStorage", e);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {!isExpanded && mergedBugs.length === 0 && (
            <div className="text-gray-500 text-sm mt-2">No Bugs available</div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bugToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-2xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <Trash2 size={20} /> Confirm Delete
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">{bugToDelete.title}</span>? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className={`px-4 py-2 text-white rounded-lg ${
                  deleting ? "bg-red-400 opacity-70 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default BugSection;