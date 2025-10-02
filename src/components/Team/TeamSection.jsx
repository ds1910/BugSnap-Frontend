import React, { useState, useEffect } from "react";
import TeamCard from "./TeamCard";
import NoTeamState from "./NoTeamState";
import { Search, Settings, X, UserPlus, Plus, Trash2 } from "lucide-react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

/* ----------------- Polished Toast Component ----------------- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
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

      <button
        onClick={onClose}
        className="ml-3 text-white/70 hover:text-white transition"
      >
        <X size={18} />
      </button>
    </div>
  );
};

/* ----------------- Helpers ----------------- */
/* consistent team key extraction */
const teamKey = (t) => String(t?._id ?? t?.id ?? "");
/* consistent member key extraction */
const memberKey = (m) => String(m?.id ?? m?._id ?? m?.email ?? "");
/* write localStorage safely */
const writeLocal = (arr) => {
  try {
    localStorage.setItem("allTeams", JSON.stringify(arr));
  } catch (e) {
    // ignore localStorage errors (quota, disabled etc.)
    console.warn("Failed writing allTeams to localStorage", e);
  }
};

/* ----------------- TeamSection Component (merged & fixed) ----------------- */
const TeamSection = ({ allTeams = [], isAuthenticated = false, authChecked = false }) => {
  // initialize teams from localStorage
  const [teams, setTeams] = useState(() => {
    try {
      const stored = localStorage.getItem("allTeams");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState("");

  // Members from backend
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false); // add member
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // States for editing & creating
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  // ---------------- Fetch all teams (sync with localStorage fallback) ----------------
  useEffect(() => {
    // Only fetch teams if user is authenticated
    if (!isAuthenticated || !authChecked) {
      console.log("TeamSection: Skipping team fetch - not authenticated or auth not checked");
      return;
    }

    const getAllTeams = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/team/allTeam`, {
          withCredentials: true,
        });
        const teamsArray = Array.isArray(response.data.teams) ? response.data.teams : Array.isArray(response.data) ? response.data : [];
        setTeams(teamsArray);
        writeLocal(teamsArray);
      } catch (err) {
        // fallback to cached teams on failure
        const storedTeams = localStorage.getItem("allTeams");
        if (storedTeams) {
          try {
            setTeams(JSON.parse(storedTeams));
          } catch {
            setTeams([]);
          }
        } else {
          setTeams([]);
        }
        console.error("Failed to fetch teams:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getAllTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authChecked]);

  // ---------------- Fetch members when Add Member modal opens ----------------
  useEffect(() => {
    const fetchMembers = async () => {
      if (showModal && isAuthenticated && authChecked) {
        setLoadingMembers(true);
        try {
          const response = await axios.get(
            `${backendUrl}/people/getAllPeople`,
            {
              withCredentials: true,
            }
          );

          // backend might return data.people or data.users etc. Prefer people.
          const membersArray = Array.isArray(response.data?.people)
            ? response.data.people
            : Array.isArray(response.data?.users)
            ? response.data.users
            : Array.isArray(response.data)
            ? response.data
            : [];
          setAllMembers(membersArray);
        } catch (err) {
          console.error("Failed to fetch members:", err);
          setAllMembers([]);
          showToast("Failed to load members", "error");
        } finally {
          setLoadingMembers(false);
        }
      } else {
        // clear search and members when modal closed (optional)
        setSearch("");
      }
    };
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, isAuthenticated, authChecked]);

  // ---------- Member Add ----------
  const handleAddMember = (team) => {
    setSelectedTeam(team);
    setShowModal(true);
  };

  const handleSelectMember = async (member) => {
    if (!selectedTeam) {
      showToast("No team selected", "error");
      return;
    }

    // Use robust keys for members/teams
    const mKey = memberKey(member);
    const teamIdToSend = selectedTeam._id ?? selectedTeam.id;
    // check already present (compare by id/_id/email)
    const alreadyPresent = (selectedTeam.members || []).some((m) => memberKey(m) === mKey);

    if (alreadyPresent) {
      showToast(`${member.name ?? member.email} is already in ${selectedTeam.name}`, "error");
      return;
    }

    let backendSucceeded = false;
    try {
      const resp = await axios.patch(
        `${backendUrl}/team/addMembers`,
        { teamId: teamIdToSend, user: member },
        { withCredentials: true }
      );

      // If backend returns updated team, replace that team in the array (preserve others)
      if (resp.status === 200 || resp.status === 201) {
        const returnedTeam = resp.data?.team ?? null;
        const returnedUser = resp.data?.user ?? null;

        if (returnedTeam) {
          setTeams((prev) => {
            const updated = prev.map((t) =>
              teamKey(t) && teamKey(returnedTeam) && teamKey(t) === teamKey(returnedTeam) ? returnedTeam : t
            );
            // if not present, add it
            const found = updated.some((t) => teamKey(t) === teamKey(returnedTeam));
            const final = found ? updated : [...updated, returnedTeam];
            writeLocal(final);
            return final;
          });
        } else {
          // If backend returns user but not team, we'll handle below
          backendSucceeded = true;
        }

        if (returnedUser) {
          setTeams((prev) => {
            const updated = prev.map((t) =>
              teamKey(t) === String(teamIdToSend) ? { ...t, members: [...(t.members || []), returnedUser] } : t
            );
            writeLocal(updated);
            return updated;
          });
        }

        backendSucceeded = true;
      } else {
        console.warn("Unexpected response adding member:", resp);
      }
    } catch (err) {
      // If backend not available or returns error, we'll fallback to local update
      console.warn("Add member backend call failed (falling back to local):", err);
    }

    // If backend didn't succeed or didn't return updated team, still update locally so UI reflects change
    if (!backendSucceeded) {
      setTeams((prev) => {
        const updated = prev.map((t) =>
          teamKey(t) === String(teamIdToSend) ? { ...t, members: [...(t.members || []), member] } : t
        );
        writeLocal(updated);
        return updated;
      });
    }

    // close modal and reset search
    setShowModal(false);
    setSearch("");
    showToast(`${member.name ?? member.email} added to ${selectedTeam.name}`, "success");
  };

  // ---------- Team Manage/Edit ----------
  const handleManage = (team) => {
    setSelectedTeam(team);
    setEditName(team.name || "");
    setEditDescription(team.description || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTeam) {
      showToast("No team selected to update", "error");
      return;
    }

    const teamIdToSend = selectedTeam._id || selectedTeam.id;

    try {
      const response = await axios.patch(
        `${backendUrl}/team/update`,
        {
          name: editName,
          description: editDescription || "",
          teamId: teamIdToSend,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const returnedTeam = response.data?.team ?? null;

        setTeams((prev) => {
          const updated = prev.map((t) =>
            t.id === (selectedTeam.id ?? selectedTeam._id) || t._id === (selectedTeam._id ?? selectedTeam.id)
              ? returnedTeam
                ? returnedTeam
                : { ...t, name: editName, description: editDescription }
              : t
          );
          writeLocal(updated);
          return updated;
        });

        setShowEditModal(false);
        showToast(`Team "${editName}" updated successfully`, "success");
      } else {
        const msg =
          response.data?.error ||
          response.data?.message ||
          "Team can't be updated.";
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("Error updating team:", err);

      if (err.response) {
        const status = err.response.status;
        const serverMsg =
          err.response.data?.error ||
          err.response.data?.message ||
          "Failed to update team.";

        if (status === 404) {
          showToast(serverMsg || "Team not found.", "error");
        } else if (status === 403) {
          showToast(
            serverMsg || "Only admin can update team settings.",
            "error"
          );
        } else {
          showToast(serverMsg || "Team can't be updated.", "error");
        }
      } else if (err.request) {
        showToast("No response from server. Check your network.", "error");
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    }
  };

  // ---------- Team Delete ----------
  const handleDeleteRequest = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTeam) {
      showToast("No team selected to delete", "error");
      return;
    }

    const teamIdToSend = selectedTeam._id || selectedTeam.id;

    try {
      const response = await axios.delete(`${backendUrl}/team/delete`, {
        data: { teamId: teamIdToSend },
        withCredentials: true,
      });

      if (response.status === 200) {
        setTeams((prev) => {
          const updated = prev.filter(
            (t) =>
              !(
                t.id === (selectedTeam.id ?? selectedTeam._id) ||
                t._id === (selectedTeam._id ?? selectedTeam.id)
              )
          );
          writeLocal(updated);
          return updated;
        });

        setShowDeleteModal(false);
        showToast(`Team "${selectedTeam.name}" deleted`, "success");
      } else {
        const msg =
          response.data?.error ||
          response.data?.message ||
          "Team can't be deleted.";
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("Error deleting team:", err);

      if (err.response) {
        const status = err.response.status;
        const serverMsg =
          err.response.data?.error ||
          err.response.data?.message ||
          "Failed to delete team.";

        if (status === 404) {
          showToast(serverMsg || "Team not found.", "error");
        } else if (status === 403) {
          showToast(serverMsg || "Only admin can delete this team.", "error");
        } else {
          showToast(serverMsg || "Team can't be deleted.", "error");
        }
      } else if (err.request) {
        showToast("No response from server. Check your network.", "error");
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    }
  };

  // ---------- Team Create ----------
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      showToast("Please enter a team name", "error");
      return;
    }
    const newTeam = {
      id: Date.now(),
      name: newTeamName,
      description: newTeamDescription,
      members: [],
    };

    // Try to create on backend; if backend returns team, prefer that
    try {
      const response = await axios.post(
        `${backendUrl}/team/create`,
        {
          name: newTeamName,
          description: newTeamDescription || "",
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200 || response.status === 201) {
        const returnedTeam = response.data?.team ?? null;
        setTeams((prev) => {
          const updated = [...prev, returnedTeam ? returnedTeam : newTeam];
          writeLocal(updated);
          return updated;
        });
      } else {
        // fallback to local if backend returned non-200
        setTeams((prev) => {
          const updated = [...prev, newTeam];
          writeLocal(updated);
          return updated;
        });
      }
    } catch (err) {
      console.warn("Create team backend failed, adding locally:", err);
      setTeams((prev) => {
        const updated = [...prev, newTeam];
        writeLocal(updated);
        return updated;
      });
    }

    setNewTeamName("");
    setNewTeamDescription("");
    setShowCreateModal(false);
    showToast(`Team "${newTeam.name}" created successfully`);
  };

  // filter members according to search (case-insensitive)
  const filteredMembers = allMembers.filter(
    (m) =>
      (m.name ?? "").toString().toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? "").toString().toLowerCase().includes(search.toLowerCase())
  );

  // ---------- Role Change ----------
const handleRoleChange = async (team, member, newRole) => {
  if (!team || !member) {
    showToast("❌ Error: Team or member not found", "error");
    return;
  }

  const teamIdToSend = team._id || team.id;
  const memberEmail = member.email;

  try {
    const resp = await axios.patch(
      `${backendUrl}/team/change-role`,
      { teamId: teamIdToSend, userMail: memberEmail, role: newRole },
      { withCredentials: true }
    );

    if (resp.status >= 200 && resp.status < 300) {
      const updatedTeam = resp.data?.team ?? null;
      if (updatedTeam) {
        setTeams((prev) => {
          const updated = prev.map((t) =>
            teamKey(t) && teamKey(updatedTeam) && teamKey(t) === teamKey(updatedTeam) ? updatedTeam : t
          );
          writeLocal(updated);
          return updated;
        });
        showToast(
          resp.data?.message ||
            `✅ Success: Role updated to "${newRole}" for ${member.name}`,
          "success"
        );
      }
    } else {
      const msg =
        resp.data?.error ||
        resp.data?.message ||
        `❌ Error: Failed to update role (status ${resp.status}).`;
      showToast(msg, "error");
    }
  } catch (err) {
    console.error("Error updating member role:", err);

    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      `❌ Error: Failed to update role (status ${
        err.response?.status || "network error"
      }).`;

    showToast(msg, "error");

    // fallback local update
    setTeams((prev) => {
      const updated = prev.map((t) =>
        teamKey(t) === String(teamIdToSend)
          ? {
              ...t,
              members: (t.members || []).map((m) =>
                m.email === memberEmail ? { ...m, role: newRole } : m
              ),
            }
          : t
      );
      writeLocal(updated);
      return updated;
    });
  }
};

/* ---------- Remove Member ---------- */
const handleRemoveMember = async (team, member) => {
  if (!team || !member) {
    showToast("❌ Error: Team or member not found", "error");
    return;
  }

  const teamIdToSend = team._id || team.id;
  const memberEmail = member.email;

  try {
    const resp = await axios.patch(
      `${backendUrl}/team/remove-member`,
      { teamId: teamIdToSend, userMail: memberEmail },
      { withCredentials: true }
    );

    // ✅ backend returns a single updated team
    const updatedTeam = resp.data?.team;
    if (updatedTeam) {
      setTeams((prev) => {
        const updated = prev.map((t) =>
          teamKey(t) && teamKey(updatedTeam) && teamKey(t) === teamKey(updatedTeam) ? updatedTeam : t
        );
        writeLocal(updated);
        return updated;
      });
      showToast(
        resp.data?.message ||
          `✅ Success: Removed ${member.name || member.email} from team`,
        "success"
      );
      return;
    }

    showToast("❌ Error: Remove member failed", "error");
  } catch (err) {
    console.error("Error removing member:", err);
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      `❌ Error: Failed to remove member (status ${
        err.response?.status || "network error"
      }).`;
    showToast(msg, "error");
  }

  // ✅ fallback: just remove locally
  setTeams((prev) => {
    const updated = prev.map((t) =>
      teamKey(t) === String(teamIdToSend)
        ? {
            ...t,
            members: (t.members || []).filter(
              (m) => (m.email ?? m.id ?? m._id) !== memberEmail
            ),
          }
        : t
    );
    writeLocal(updated);
    return updated;
  });
  showToast(
    `⚠️ Local update: Removed ${member.name || member.email} (not synced with server)`,
    "error"
  );
};


  return (
    <div className="p-6">
      {/* Heading with Add button */}
      <div className=" flex items-center justify-between mb-6">
        <h2
          className=" text-2xl font-semibold text-white mb-6 
             relative inline-block 
             hover:text-blue-400 transition-colors duration-300
             after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-blue-500 after:left-0 after:-bottom-1
             hover:after:w-full after:transition-all after:duration-300"
        >
          Teams
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                     transform transition duration-200 hover:scale-105 hover:bg-blue-700
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Create team"
        >
          <Plus size={18} /> Create Team
        </button>
      </div>

      {/* Show loading state or no teams state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : teams.length === 0 ? (
        <NoTeamState onCreateTeam={() => setShowCreateModal(true)} />
      ) : (
        /* Grid with scroll */
        <div className="mt-2 max-h-[500px] overflow-y-auto pr-2">
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
            <TeamCard
              key={team.id ?? team._id}
              team={{ ...team, membersCount: (team.members || []).length }}
              onAddMember={handleAddMember}
              onManage={handleManage}
              onDelete={handleDeleteRequest}
              onRoleChange={handleRoleChange}
              onRemoveMember={handleRemoveMember}
            />
          ))}
        </div>
      </div>
    )}

      {/* ---------------- Modals ---------------- */}

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus size={20} /> Add Member
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSearch("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Add a new member to{" "}
              <span className="font-semibold">{selectedTeam?.name}</span>.
            </p>
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search or enter email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {loadingMembers ? (
                <p className="text-gray-400 text-sm">Loading members...</p>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member._id ?? member.id}
                    onClick={() => handleSelectMember(member)}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 text-white font-semibold">
                      {(member.name ?? "").toString().charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No members found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} /> Edit Team
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-24 mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={20} /> Create Team
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              className="w-full h-24 mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-2xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <Trash2 size={20} /> Confirm Delete
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {selectedTeam?.name}
              </span>
              ? This action cannot be undone.
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TeamSection;
