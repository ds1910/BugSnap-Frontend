import React, { useEffect, useState } from "react";
import { Popover } from "@headlessui/react";
import { User } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AssignBugBadge = ({ value, onChange }) => {
//  console.log("value: "+value);
  const [assignees, setAssignees] = useState([]); // list of users
  const [selected, setSelected] = useState(value || null); // currently selected user

  // ==============================
  // Keep child state in sync with parent value
  // ==============================
  useEffect(() => {
    setSelected(value || null);
  }, [value]);

  // ==============================
  // Fetch users from API (active team from localStorage)
  // ==============================
  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const activeTeamString = localStorage.getItem("activeTeam");
        if (!activeTeamString) {
          console.warn("No active team found in localStorage");
          return;
        }

        const activeTeam = JSON.parse(activeTeamString);

        const res = await axios.post(
          `${backendUrl}/team/members`,
          { teamId: activeTeam._id },
          { withCredentials: true }
        );

        // assuming backend returns { members: [ { name, email, role } ] }
        const formatted = (res.data.members || []).map((m, index) => ({
          id: index, // fallback if no unique _id is provided
          name: m.name,
          email: m.email,
          role: m.role,
        }));

        setAssignees(formatted);
      } catch (error) {
        console.error("Failed to fetch assignees:", error);
      }
    };

    fetchAssignees();
  }, []);

  // ==============================
  // Handle selecting a user
  // ==============================
  const handleSelect = (user, close) => {
    setSelected(user);
    onChange?.(user);
    close();
  };

  // Label to show in button
  const selectedLabel =
    selected && (typeof selected === "string" ? selected : selected.name);

  return (
    <Popover className="relative inline-block">
      {({ close }) => (
        <>
          {/* ---------- Trigger Button ---------- */}
          <Popover.Button
            as="div"
            className="group flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer select-none transition-colors duration-150 hover:text-white"
            title={selectedLabel || "Assign"}
          >
            <User
              size={18}
              className={`${
                selectedLabel ? "text-white" : "text-gray-300"
              } group-hover:text-gray-300`}
            />
            <span className="text-white text-sm font-medium">
              {selectedLabel || "Assign"}
            </span>
          </Popover.Button>

          {/* ---------- Dropdown Panel ---------- */}
          <Popover.Panel className="absolute mt-2 w-52 bg-[#1E1E1E] border border-[#505050] rounded-lg shadow-lg z-40 p-2">
            {assignees.length > 0 ? (
              assignees.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelect(user, close)}
                  className="flex items-center gap-2 w-full px-2 py-2 text-base text-white cursor-pointer transition-colors duration-150 hover:text-blue-400 rounded"
                >
                  <User size={18} stroke="currentColor" />
                  <span className="font-medium">{user.name}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm px-2 py-1">
                No members found
              </div>
            )}
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};

export default AssignBugBadge;
