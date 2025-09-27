import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Users,
  Settings,
  UserPlus,
  MoreVertical,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import axios from "axios"; // added for backend call

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/* ----------------- Toast ----------------- */
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white shadow-lg
        ${type === "success" ? "bg-green-500" : "bg-red-500"} animate-pop`}
    >
      {message}
    </div>
  );
};

/* ----------------- Confirmation Modal ----------------- */
const ConfirmModal = ({
  open,
  title,
  message,
  danger,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 w-full max-w-md p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-white text-lg font-semibold">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-zinc-800 transition"
          >
            <X size={18} className="text-gray-300" />
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1 rounded-md text-white transition ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {danger ? "Remove" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------- MemberRow ----------------- */
const MemberRow = ({ member, avatarBg, currentUser, onOpenMenu }) => {
  const name = (member && member.name) || currentUser?.name || "U";
  const role = member?.role || "Member";
  const isAdmin = (role || "").toString().toLowerCase() === "admin";
  const online = !!member?.online;
  return (
    <div
      className="flex items-center justify-between gap-3 p-2 rounded-md cursor-pointer
                 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      role="listitem"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="relative">
          {member?.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={name}
              className={`w-10 h-10 rounded-full object-cover border ${
                isAdmin ? "ring-2 ring-blue-500" : "ring-0"
              } shadow-sm`}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold shadow-sm
                          bg-gradient-to-br ${avatarBg(name)} ${
                isAdmin ? "ring-2 ring-blue-500" : ""
              }`}
              aria-hidden
            >
              {(name?.charAt(0) || "U").toUpperCase()}
            </div>
          )}

          {/* Online dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-zinc-900
                        ${online ? "bg-green-400" : "bg-gray-600"}`}
            title={online ? "Online" : "Offline"}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm truncate">
              {name}
            </span>
            {isAdmin && (
              <span
                className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-md"
                title="Admin"
              >
                Admin
              </span>
            )}
          </div>
          <span className="text-gray-400 text-xs truncate">
            {isAdmin ? "Admin" : "Member"}
          </span>
        </div>
      </div>

      {/* Three-dot button opens the global fixed menu */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            onOpenMenu(member, rect);
          }}
          className="p-1 rounded-full hover:bg-zinc-700 transition shadow-sm hover:shadow-md"
          aria-haspopup="true"
          title="More"
        >
          <MoreVertical size={16} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
};

/* ----------------- Main TeamCard ----------------- */
const TeamCard = ({
  team,
  onDelete,
  onManage,
  onAddMember,
  onRoleChange, // optional callback when role toggles
  onRemoveMember, // optional callback when a member is removed
}) => {
  const { name, description, members: initialMembers = [] } = team;

  // helper: ensure every member has an id (fallback to name) and dedupe by id
  const ensureAndDedupe = (arr) => {
    if (!Array.isArray(arr)) return [];
    const map = new Map();
    for (let i = 0; i < arr.length; i++) {
      const m = arr[i] || {};
      const key = m.id ?? m.email ?? m.name ?? `__idx_${i}`;
      // normalize key to string
      const sk = String(key);
      // prefer the later entry (so if duplicates exist, later overrides earlier)
      map.set(sk, { ...m, id: sk });
    }
    return Array.from(map.values());
  };

  const [members, setMembers] = useState(() => ensureAndDedupe(initialMembers));
  const [showPopup, setShowPopup] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    type: null, // 'remove' | 'role'
    member: null,
  });

  // top-level menu state for fixed-position menu
  const [menuState, setMenuState] = useState({
    open: false,
    member: null,
    x: 0,
    y: 0,
  });

  // current user fallback from localStorage
  const currentUser = (() => {
    try {
      const info = JSON.parse(localStorage.getItem("userInfo"));
      if (info && typeof info === "object") return info;
    } catch (e) {}
    return { name: "User" };
  })();

  const avatarBg = (n) => {
    const colors = [
      "from-blue-500 to-purple-600",
      "from-purple-500 to-pink-500",
      "from-green-500 to-teal-500",
      "from-orange-400 to-red-500",
      "from-indigo-500 to-violet-600",
    ];
    if (!n) return colors[0];
    const idx = n.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  // safe filter after deduplication
  const filtered = ensureAndDedupe(members).filter((m) =>
    (m?.name || currentUser.name || "")
      .toString()
      .toLowerCase()
      .includes((memberSearch || "").toLowerCase())
  );

  // admins first & stable sort
  filtered.sort((a, b) => {
    const ra = (a?.role || "").toString().toLowerCase() === "admin" ? 0 : 1;
    const rb = (b?.role || "").toString().toLowerCase() === "admin" ? 0 : 1;
    if (ra !== rb) return ra - rb;
    return (a?.name || "").localeCompare(b?.name || "");
  });

  const admins = filtered.filter(
    (m) => (m?.role || "").toString().toLowerCase() === "admin"
  );
  const normalMembers = filtered.filter(
    (m) => (m?.role || "").toString().toLowerCase() !== "admin"
  );

  // menu open handler (anchor is button rect)
  const openMenuAt = (member, rect) => {
    // compute desired fixed menu coords; adjust to avoid overflow
    const menuWidth = 180; // approximate width in px
    const menuHeight = 96; // approximate height
    let left = rect.right + 6; // place to the right by default
    let top = rect.top; // align top

    // if would overflow right edge, place to left
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    if (left + menuWidth > winW - 12) {
      left = rect.left - menuWidth - 6;
    }
    // if below fold, push up
    if (top + menuHeight > winH - 12) {
      top = Math.max(12, winH - menuHeight - 12);
    }

    setMenuState({ open: true, member, x: left, y: top });
  };

  // close menu
  const closeMenu = () =>
    setMenuState({ open: false, member: null, x: 0, y: 0 });

  // request handlers from MemberRow
  const openConfirmRole = (member) => {
    setConfirm({ open: true, type: "role", member });
    closeMenu();
  };
  const openConfirmRemove = (member) => {
    setConfirm({ open: true, type: "remove", member });
    closeMenu();
  };

  const closeConfirm = () =>
    setConfirm({ open: false, type: null, member: null });

  const showToast = (message, type = "success") => setToast({ message, type });

  /**
   * When parent provides onRoleChange, call it with (team, member, newRole).
   * Otherwise fallback to local state + optional backend call.
   */
  const performRoleChange = async (teamArg, memberArg, newRole) => {
        onRoleChange(teamArg, memberArg, newRole);
      return;
    }

  

  /**
   * When parent provides onRemoveMember, call it with (team, member).
   * Otherwise fallback to local state + optional backend call.
   */
  const performRemoveMember = async (teamArg, memberArg) => {
    onRemoveMember(teamArg, memberArg);
      return;
    }


  const handleConfirm = () => {
    if (!confirm.open || !confirm.member) return;
    const m = confirm.member;
    if (confirm.type === "role") {
      // Toggle role (case-insensitive)
      const currentRole = (m.role || "Member").toString().toLowerCase();
      const newRole = currentRole === "admin" ? "Member" : "Admin";

      // Delegate to performRoleChange which either calls parent or backend fallback
      performRoleChange(team, m, newRole);
    } else if (confirm.type === "remove") {
      // Delegate to performRemoveMember
      performRemoveMember(team, m);
    }
    closeConfirm();
  };

  // close menu on outside click (global)
  useEffect(() => {
    const onGlobalClick = (e) => {
      // if click lands outside the fixed menu, close it
      if (!menuState.open) return;
      const menuEl = document.getElementById("teamcard-fixed-menu");
      if (menuEl && !menuEl.contains(e.target)) {
        closeMenu();
      }
    };
    window.addEventListener("mousedown", onGlobalClick);
    return () => window.removeEventListener("mousedown", onGlobalClick);
  }, [menuState.open]);

  // close menu when popup closes
  useEffect(() => {
    if (!showPopup) closeMenu();
  }, [showPopup]);

  // Ensure we dedupe when initialMembers prop changes
  useEffect(() => {
    setMembers(ensureAndDedupe(initialMembers));
  }, [initialMembers]);

  
  useEffect(() => {
    const fetchMembers = async () => {
  
      if (!team?._id) return;
    
      try {
        const resp = await axios.post(
          `${backendUrl}/team/members`,
          { teamId: team._id }, 
          { withCredentials: true } 
        );

       
        const membersArray = Array.isArray(resp.data?.members)
          ? resp.data.members
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        setMembers(ensureAndDedupe(membersArray));
      } catch (err) {
        console.error("Failed to fetch team members:", err);
        showToast("Failed to load members from server", "error");
        // fallback to initial members already provided
        setMembers(ensureAndDedupe(initialMembers));
      }
    };
    fetchMembers();
    
  }, [team?.id, initialMembers]);



  const localAddMember = (teamArg) => {
    const newMemberName = window.prompt("Enter new member name (local only):");
    if (!newMemberName) return;
   // console.log("In localaddmemeber: " + newMemberName);
    // create simple id from name + timestamp to avoid collisions
    const newId = `${newMemberName.replace(/\s+/g, "_")}_${Date.now()}`;
    const newMember = {
      id: newId,
      name: newMemberName,
      role: "Member",
      online: false,
    };
    setMembers((prev) => ensureAndDedupe([...prev, newMember]));
    showToast(`${newMemberName} added (local)`, "success");
  };

  const handleAddMemberClick = () => {
    if (typeof onAddMember === "function") {
   
      onAddMember(team);
    } else {
      // fallback local handler (no backend)
      localAddMember(team);
    }
  };

  // ensure padding after last member (gives breathing room)
  const listContainerClass = "flex flex-col gap-2 overflow-y-auto pr-2 pb-8";

  return (
    <>
      <div
        className="bg-zinc-800/70 rounded-2xl shadow-lg p-6 flex flex-col justify-between w-80
                   border border-zinc-700 hover:border-blue-500
                   transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-2 relative"
      >
        {/* Avatar + Team Info */}
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-full 
                        bg-gradient-to-br ${avatarBg(name)}
                        text-white font-bold text-xl shadow-lg flex-shrink-0`}
          >
            {(name?.charAt(0) || "T").toUpperCase()}
          </div>

          <div className="flex flex-col overflow-hidden">
            <h2 className="text-white font-semibold text-lg leading-tight break-words">
              {name || "Unnamed Team"}
            </h2>
            <p className="text-sm text-gray-400 leading-snug break-words line-clamp-2">
              {description || "No description available"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 text-sm">
          {/* Members Button */}
          <button
            className="flex items-center gap-2 text-gray-300 focus:outline-none"
            onClick={() => setShowPopup(true)}
            aria-haspopup="dialog"
          >
            <Users size={18} className="text-blue-400" />
            <span className="font-medium">
              {ensureAndDedupe(members).length}
            </span>
            <span className="text-gray-400">
              {ensureAndDedupe(members).length === 1 ? "Member" : "Members"}
            </span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddMemberClick}
              className="p-2 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors duration-200"
              title="Add member"
            >
              <UserPlus size={16} />
            </button>

            <button
              onClick={() => onManage?.(team)}
              className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors duration-200"
              title="Manage team"
            >
              <Settings size={16} />
            </button>

            <button
              onClick={() => onDelete?.(team)}
              className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors duration-200"
              title="Delete team"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-zinc-900 w-[36rem] max-h-[92vh] rounded-lg shadow-xl p-5 relative flex flex-col">
            <h2 className="text-white text-lg font-semibold mb-3">Members</h2>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 p-1 hover:bg-zinc-700 rounded-full transition-colors"
              aria-label="Close members"
            >
              <X size={20} className="text-gray-300" />
            </button>

            {/* Search */}
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full p-2 rounded-md bg-zinc-800 text-white placeholder-gray-500 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            {/* Members list with extra bottom padding */}
            <div className={listContainerClass}>
              {admins.length > 0 && (
                <>
                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1">
                    Admins
                  </p>
                  {admins.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      avatarBg={avatarBg}
                      currentUser={currentUser}
                      onOpenMenu={openMenuAt}
                    />
                  ))}
                </>
              )}

              {normalMembers.length > 0 && (
                <>
                  <p className="text-gray-400 text-xs uppercase font-semibold mb-1 mt-3">
                    Members
                  </p>
                  {normalMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      avatarBg={avatarBg}
                      currentUser={currentUser}
                      onOpenMenu={openMenuAt}
                    />
                  ))}
                </>
              )}

              {filtered.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-2">
                  No members found
                </p>
              )}
            </div>
          </div>

          {/* Fixed-position context menu (anchored to clicked button) */}
          {menuState.open && menuState.member && (
            <div
              id="teamcard-fixed-menu"
              className="absolute z-[99999] bg-zinc-800 border border-zinc-700 rounded-md shadow-xl overflow-hidden"
              style={{
                left: `${menuState.x}px`,
                top: `${menuState.y}px`,
                width: 180,
                transform: "translateY(6px)",
              }}
            >
              <button
                onClick={() => openConfirmRole(menuState.member)}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-500 transition-colors"
              >
                {(menuState.member?.role || "").toString().toLowerCase() !==
                "admin"
                  ? "Make Admin"
                  : "Revoke Admin"}
              </button>

              <button
                onClick={() => openConfirmRemove(menuState.member)}
                className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-600/10 transition-colors"
              >
                Remove member
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.type === "remove" ? "Remove member" : "Change role"}
        danger={confirm.type === "remove"}
        message={
          confirm.type === "remove"
            ? `Are you sure you want to remove "${
                confirm.member?.name || currentUser.name
              }" from the team? This action cannot be undone.`
            : `Are you sure you want to ${
                confirm.member &&
                (confirm.member.role || "").toString().toLowerCase() === "admin"
                  ? "revoke admin rights for"
                  : "grant admin rights to"
              } "${confirm.member?.name || currentUser.name}"?`
        }
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* small animations */}
      <style>{`\n        @keyframes fadeScale {\n          0% { opacity: 0; transform: translateY(-6px) scale(.98); }\n          100% { opacity: 1; transform: translateY(0) scale(1); }\n        }\n        .animate-fadeScale { animation: fadeScale 180ms ease-out forwards; }\n        @keyframes pop {\n          0% { opacity: 0; transform: translateY(-6px) scale(.98); }\n          100% { opacity: 1; transform: translateY(0) scale(1); }\n        }\n        .animate-pop { animation: pop 220ms cubic-bezier(.2,.9,.2,1) both; }\n      `}</style>
    </>
  );
};

TeamCard.propTypes = {
  team: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    membersCount: PropTypes.number,
    members: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        role: PropTypes.string,
        avatarUrl: PropTypes.string,
        online: PropTypes.bool,
      })
    ),
  }).isRequired,
  onDelete: PropTypes.func,
  onManage: PropTypes.func,
  onAddMember: PropTypes.func,
  onRoleChange: PropTypes.func,
  onRemoveMember: PropTypes.func,
};

export default TeamCard;
