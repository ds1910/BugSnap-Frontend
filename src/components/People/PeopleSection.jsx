// PeopleSection.jsx
import React, { useState, useEffect } from "react";
import PeopleCard from "./PeopleCard";
import { Search, X, Plus, Trash2 } from "lucide-react";
import ProfilePopup from "./ProfilePopup";
import InvitePopup from "./InvitePopup";
import Message from "./Message";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[9999] 
        transform transition-all duration-500 ease-in-out
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
        <X size={18} />
      </button>
    </div>
  );
};

const PeopleSection = () => {
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [search, setSearch] = useState("");

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const [loading, setLoading] = useState(false);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchPeople = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/people/getAllPeople`, {
          withCredentials: true,
        });

        const raw = res?.data?.people ?? res?.data ?? [];

        const normalized = (Array.isArray(raw) ? raw : []).map((p) => {
          const id = p._id ?? p.id ?? Math.random().toString(36).slice(2, 9);

          let teams = p.teams ?? [];
          if (Array.isArray(teams) && teams.length > 0 && typeof teams[0] === "object") {
            teams = teams.map((t) => t.name ?? t);
          }

          const bugsRaw = Array.isArray(p.bugs) ? p.bugs : [];
          const bugs = bugsRaw.map((b) => ({
            id: b._id ?? b.id ?? Math.random().toString(36).slice(2, 9),
            title: b.title ?? "",
            status: b.status ?? "",
            ...b,
          }));

          return {
            ...p,
            id,
            teams,
            bugs,
          };
        });

        if (mounted) setPeople(normalized);
      } catch (err) {
        console.error("Failed to fetch people:", err);
        showToast("Failed to load people from server", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPeople();

    return () => {
      mounted = false;
    };
  }, []);

  const handleView = (person) => {
    console.log("person " + person);
    setSelectedPerson(person);
    setShowViewModal(true);
  };

  const handleMessage = (person) => {
    setSelectedPerson(person);
    setShowMessageModal(true);
  };

  const handleEdit = (person) => {
    setSelectedPerson(person);
    setEditName(person.name ?? "");
    setEditEmail(person.email ?? "");
    setEditRole(person.role ?? "");
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPerson) return;
    setPeople((prev) =>
      prev.map((p) =>
        p.id === selectedPerson.id ? { ...p, name: editName, email: editEmail, role: editRole } : p
      )
    );
    setSelectedPerson((sp) => (sp ? { ...sp, name: editName, email: editEmail, role: editRole } : sp));
    setShowEditModal(false);
    showToast(`"${editName}" updated successfully`);
  };

  const handleDeleteRequest = (person) => {
    setSelectedPerson(person);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPerson) return;

    const emailToDelete = selectedPerson.email ?? selectedPerson.id ?? null;
    if (!emailToDelete) {
      showToast("Cannot delete: email/id not available", "error");
      return;
    }

    setDeleting(true);
    try {
      const res = await axios.delete(`${backendUrl}/people/delete`, {
        data: { email: emailToDelete },
        withCredentials: true,
      });

      const data = res?.data ?? {};
      const success = data.success !== undefined ? data.success : res.status >= 200 && res.status < 300;
      const msg = data.message ?? (success ? `${selectedPerson.name} deleted` : "Delete failed");

      if (success) {
        setPeople((prev) => prev.filter((p) => p.id !== selectedPerson.id));
        setShowDeleteModal(false);
        setSelectedPerson(null);
        showToast(msg, "success");
      } else {
        showToast(msg, "error");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      const errMsg = err?.response?.data?.message || err.message || "Delete failed";
      showToast(errMsg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredPeople = people.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      ((p.role ?? "").toLowerCase().includes(q))
    );
  });


const handleSendMessage = async ({ email, subject, messageHtml, attachments }) => {
  try {
    // Prepare FormData to handle files
    const formData = new FormData();
    formData.append("email", email);
    formData.append("subject", subject);
    formData.append("messageHtml", messageHtml);
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    // POST request to backend
    const response = await axios.post(
      `${backendUrl}/people/sendmessage`,
      formData,
      {
        withCredentials: true, // send cookies
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Show toast based on backend response
    const msg = response?.data?.message || `Message sent to ${email}`;
    showToast(msg, "success");

    setShowMessageModal(false); // close modal
  } catch (err) {
    // Extract backend error message if available
    const errorMsg = err?.response?.data?.message || err?.message || "Failed to send message";
    showToast(errorMsg, "error");
    throw err;
  }
};


  return (
    <div className="p-6">
      <div className=" flex items-center justify-between mb-6">
        <h2
          className=" text-2xl font-semibold text-white mb-6 relative inline-block
             hover:text-blue-400 transition-colors duration-300
             after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-blue-500 after:left-0 after:-bottom-1
             hover:after:w-full after:transition-all after:duration-300"
        >
          People
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white transform transition duration-200 hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Invite people"
          >
            <Plus size={18} /> Invite
          </button>
        </div>
      </div>

      <div className=" max-h-[500px] overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-8 text-gray-300">Loading people...</div>
        ) : (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch">
            {filteredPeople.length === 0 ? (
              <div className="text-gray-400 col-span-full">No people found.</div>
            ) : (
              filteredPeople.map((person) => (
                <div key={person.id} className="h-full flex">
                  <div className="w-full">
                    <PeopleCard
                      person={person}
                      onMessage={() => handleMessage(person)}
                      onEdit={() => handleEdit(person)}
                      onDelete={() => handleDeleteRequest(person)}
                      onCopy={() => {
                        if (person.email) {
                          navigator.clipboard
                            ?.writeText(person.email)
                            .then(() => {
                              showToast("Email copied to clipboard", "success");
                            }, () => {
                              showToast("Failed to copy email", "error");
                            });
                        } else {
                          showToast("No email to copy", "error");
                        }
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showEditModal && selectedPerson && (
        <div className=" fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Person</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <label className=" block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />

            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />

            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <input
              type="text"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedPerson && (
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
              <span className="font-semibold text-white">{selectedPerson.name}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className={`px-4 py-2 text-white rounded-lg ${deleting ? "bg-red-400 opacity-70 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InvitePopup
          onClose={() => setShowInviteModal(false)}
          onInvite={(emails) => {
            setShowInviteModal(false);
            showToast(`Invite sent to ${emails}`, "success");
          }}
          onInviteError={(errMsg) => {
            showToast(errMsg || "Invite failed", "error");
          }}
        />
      )}

      {showMessageModal && selectedPerson && (
        <Message person={selectedPerson} onClose={() => setShowMessageModal(false)} onSend={handleSendMessage} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PeopleSection;
