import React, { useEffect, useState, useMemo } from "react";
import { Popover } from "@headlessui/react";
import { User, X, UserCheck, Plus } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Enhanced custom scrollbar styles with modern design
const scrollbarStyles = `
  .assign-dropdown-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .assign-dropdown-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.01);
    border-radius: 10px;
    margin: 4px 0;
  }
  .assign-dropdown-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4));
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  .assign-dropdown-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.6));
    border-color: rgba(255, 255, 255, 0.15);
    transform: scaleX(1.2);
    box-shadow: 0 4px 12px rgba(99,102,241, 0.3);
  }
  .assign-dropdown-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(99,102,241,0.4) rgba(255, 255, 255, 0.01);
    scroll-behavior: smooth;
    scroll-padding: 8px;
  }
  
  /* Glass morphism effect for dropdown */
  .assign-glass-panel {
    backdrop-filter: blur(20px);
    background: linear-gradient(135deg, 
      rgba(37, 37, 37, 0.95) 0%, 
      rgba(42, 42, 42, 0.9) 50%, 
      rgba(37, 37, 37, 0.95) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 8px 16px rgba(99, 102, 241, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  
  /* Smooth hover animations */
  .assign-smooth-hover {
    transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .assign-smooth-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(99, 102, 241, 0.1);
  }
  
  /* Enhanced focus states */
  .assign-focus-ring:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
  
  /* Modern glow effects */
  .assign-glow-primary {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
  }
  
  /* Smooth animations */
  .assign-smooth-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .assign-smooth-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
}

// Utility function to get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Utility function to get consistent colors based on name
const getAvatarColor = (name) => {
  if (!name) return "bg-gray-500";
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
    "bg-indigo-500", "bg-red-500", "bg-yellow-500", "bg-teal-500",
    "bg-orange-500", "bg-cyan-500"
  ];
  const index = name.length % colors.length;
  return colors[index];
};

const AssignBugBadge = ({ value, onChange, compact = false }) => {
  const [assignees, setAssignees] = useState([]); // list of users
  const [selected, setSelected] = useState(value || []); // array of selected users

  // Helper function to check if there are duplicate names in the team - improved logic
  const duplicateNames = useMemo(() => {
    if (!assignees || assignees.length === 0) return [];
    const nameCount = {};
    assignees.forEach(user => {
      nameCount[user.name] = (nameCount[user.name] || 0) + 1;
    });
    const duplicates = Object.keys(nameCount).filter(name => nameCount[name] > 1);
    // console.log('📊 Duplicate name analysis:', { nameCount, duplicates });
    return duplicates;
  }, [assignees]);

  // ==============================
  // Keep child state in sync with parent value and enrich with full user data
  // ==============================
  useEffect(() => {
    // Ensure value is always treated as an array
    const arrayValue = Array.isArray(value) ? value : (value ? [value] : []);
    
    // Enrich the value with full user data from assignees list
    const enrichedSelection = arrayValue.map(selectedItem => {
      // console.log("🔄 Processing selected item:", selectedItem);
      
      if (typeof selectedItem === 'string') {
        // Legacy string format - try to find matching user
        const matchingUser = assignees.find(user => user.name === selectedItem);
        // console.log("🔄 String format - found matching user:", matchingUser);
        return matchingUser || { name: selectedItem, email: '', id: null, role: '' };
      } else if (selectedItem && selectedItem.name) {
        // Object format - try to find full user data and merge
        const matchingUser = assignees.find(user => {
          // Match by ID first (most reliable), then by email, then by name
          if (selectedItem.id && user.id && selectedItem.id === user.id) {
            // console.log("🔄 ID matching:", { selectedId: selectedItem.id, userId: user.id, match: true });
            return true;
          }
          if (selectedItem.email && user.email && selectedItem.email !== '' && user.email !== '') {
            const emailMatch = selectedItem.email === user.email;
            // console.log("🔄 Email matching:", { selectedEmail: selectedItem.email, userEmail: user.email, match: emailMatch });
            return emailMatch;
          }
          const nameMatch = selectedItem.name === user.name;
          // console.log("🔄 Name matching:", { selectedName: selectedItem.name, userName: user.name, match: nameMatch });
          return nameMatch;
        });
        
        // console.log("🔄 Object format - found matching user:", matchingUser);
        
        if (matchingUser) {
          // Return the full user data from assignees list
          return { ...matchingUser };
        } else {
          // Fallback to selected item data
          return {
            name: selectedItem.name || '',
            email: selectedItem.email || '',
            id: selectedItem.id || null,
            role: selectedItem.role || ''
          };
        }
      }
      return selectedItem;
    });
    
    // 🔧 DEDUPLICATION: Remove duplicates based on user ID (primary) or email (secondary)
    const deduplicatedSelection = [];
    const seenIds = new Set();
    const seenEmails = new Set();
    
    for (const user of enrichedSelection) {
      // Skip if we've already seen this user ID
      if (user.id && seenIds.has(user.id)) {
        // console.log("🔄 Skipping duplicate user by ID:", user);
        continue;
      }
      
      // Skip if we've already seen this email (and user has no ID)
      if (!user.id && user.email && user.email !== '' && seenEmails.has(user.email)) {
        // console.log("🔄 Skipping duplicate user by email:", user);
        continue;
      }
      
      // Add user to the deduplicated list
      deduplicatedSelection.push(user);
      if (user.id) seenIds.add(user.id);
      if (user.email && user.email !== '') seenEmails.add(user.email);
    }
    
    // console.log('🔄 Value sync - Original:', arrayValue);
    // console.log('🔄 Value sync - Enriched:', enrichedSelection);
    // console.log('🔄 Value sync - Deduplicated:', deduplicatedSelection);
    
    setSelected(deduplicatedSelection);
  }, [value, assignees]); // Include assignees as dependency

  // ==============================
  // Fetch users from API (active team from localStorage)
  // ==============================
  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const activeTeamString = localStorage.getItem("activeTeam");
        
        if (!activeTeamString) {
          // console.warn("No active team found in localStorage");
          return;
        }

        const activeTeam = JSON.parse(activeTeamString);

        const res = await axios.post(
          `${backendUrl}/team/members`,
          { teamId: activeTeam._id },
          { 
            withCredentials: true // Use cookies for authentication
          }
        );

        // Format members for display with proper ID handling
        const formatted = (res.data.members || []).map((m, index) => ({
          id: m._id || index, // Use backend _id as primary identifier
          name: m.name || 'Unknown User',
          email: m.email || '', // Handle missing emails
          role: m.role || 'member',
        }));
        
        // console.log('📋 Formatted team members:', formatted);
        // console.log('📧 Email status:', formatted.map(m => ({ name: m.name, email: m.email, hasEmail: !!m.email })));
        
        setAssignees(formatted);
      } catch (error) {
        // console.error("Failed to fetch assignees:", error);
      }
    };

    fetchAssignees();
  }, []);



  // ==============================
  // Handle selecting/deselecting a user with improved logic
  // ==============================
  const handleToggleUser = (user) => {
    // Ensure selected is always an array
    const currentSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);
    
    // console.log("🔍 ASSIGNMENT DEBUG:", {
    //   currentSelected: currentSelected,
    //   currentLength: currentSelected.length,
    //   userToToggle: user,
    //   userEmail: user.email,
    //   userName: user.name,
    //   userHasEmail: !!user.email,
    //   canAddMore: currentSelected.length < 5,
    //   selectedEmails: currentSelected.map(s => typeof s === 'string' ? s : s.email),
    //   selectedDetails: currentSelected.map(s => ({ 
    //     name: typeof s === 'string' ? s : s.name, 
    //     email: typeof s === 'string' ? 'legacy' : s.email,
    //     hasEmail: typeof s === 'string' ? false : !!s.email
    //   }))
    // });
    
    // console.log("🔍 About to check if user is already selected...");
    // console.log("🔍 Available users in team:", assignees.map(u => ({ name: u.name, email: u.email })));
    
    // Use ID as primary unique identifier, EMAIL as secondary for users with same names but different emails
    const isAlreadySelected = currentSelected.some(s => {
      if (typeof s === 'string') {
        return s === user.name; // Legacy support for string format
      } else {
        // Primary: Match by ID (most reliable)
        if (s.id && user.id && s.id === user.id) {
          // console.log('🔍 ID comparison:', { 
          //   selectedId: s.id, 
          //   userId: user.id, 
          //   match: true 
          // });
          return true;
        }
        // Secondary: Match by EMAIL if both have valid emails and no ID match
        if (s.email && user.email && s.email !== '' && user.email !== '') {
          const emailMatch = s.email === user.email;
          // console.log('🔍 Email comparison:', { 
          //   selectedEmail: s.email, 
          //   userEmail: user.email, 
          //   match: emailMatch 
          // });
          return emailMatch;
        }
        // Fallback: Match by name only if no ID or email available
        if (!s.id && !user.id && (!s.email || s.email === '') && (!user.email || user.email === '')) {
          const nameMatch = s.name === user.name;
          // console.log('🔍 Name comparison (no ID/email):', { 
          //   selectedName: s.name, 
          //   userName: user.name, 
          //   match: nameMatch 
          // });
          return nameMatch;
        }
        return false;
      }
    });
    
    // console.log('🔍 isAlreadySelected result:', isAlreadySelected);
    
    let newSelected;
    if (isAlreadySelected) {
      // Remove user
      newSelected = currentSelected.filter(s => {
        if (typeof s === 'string') {
          return s !== user.name; // Legacy support
        } else {
          // Primary: Match by ID (most reliable)
          if (s.id && user.id && s.id === user.id) {
            return false; // Remove this user
          }
          // Secondary: Match by EMAIL if both have valid emails and no ID match
          if (s.email && user.email && s.email !== '' && user.email !== '') {
            return s.email !== user.email; // Remove if emails match
          }
          // Fallback: Match by name only if no ID or email available
          if (!s.id && !user.id && (!s.email || s.email === '') && (!user.email || user.email === '')) {
            return s.name !== user.name; // Remove if names match
          }
          return true; // Keep this user
        }
      });
      // console.log("🔍 REMOVING user, new selection:", newSelected);
    } else {
      // Add user (limit to 5 assignees)
      if (currentSelected.length >= 5) {
        // console.log("🔍 BLOCKED: Maximum 5 assignments reached");
        return; // Don't add more than 5
      }
      // Store user objects with consistent structure
      const userToAdd = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      newSelected = [...currentSelected, userToAdd];
      // console.log("🔍 ADDING user, new selection:", newSelected);
    }
    
    setSelected(newSelected);
    
    // Trigger immediate update to parent and backend
    if (onChange) {
      // console.log("=== Assignment Update ===");
      // console.log("Previous selection:", currentSelected);
      // console.log("New selection:", newSelected);
      
      // Format for backend - send complete user objects for proper identification
      const backendFormat = newSelected.map(user => ({
        name: typeof user === 'string' ? user : user.name,
        id: typeof user === 'string' ? null : user.id,
        email: typeof user === 'string' ? '' : (user.email || ''),
        role: typeof user === 'string' ? '' : (user.role || 'member')
      }));
      
      // console.log("Backend format (complete objects):", backendFormat);
      // console.log("========================");
      onChange(backendFormat);
    }
  };

  // Remove a specific user with enhanced functionality
  const removeUser = (userToRemove, e) => {
    e.stopPropagation();

    // Ensure selected is always an array
    const currentSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);
    
    const newSelected = currentSelected.filter(s => {
      if (typeof s === 'string') {
        return s !== userToRemove.name; // Legacy support
      } else {
        // Primary: Match by ID (most reliable)
        if (s.id && userToRemove.id && s.id === userToRemove.id) {
          return false; // Remove this user
        }
        // Secondary: Match by EMAIL if both have valid emails and no ID match
        if (s.email && userToRemove.email && s.email !== '' && userToRemove.email !== '') {
          return s.email !== userToRemove.email; // Remove if emails match
        }
        // Fallback: Match by name only if no ID or email available
        if (!s.id && !userToRemove.id && (!s.email || s.email === '') && (!userToRemove.email || userToRemove.email === '')) {
          return s.name !== userToRemove.name; // Remove if names match
        }
        return true; // Keep this user
      }
    });
    
    setSelected(newSelected);
    
    // Ensure parent component gets updated with proper format
    if (onChange) {
      const backendFormat = newSelected.map(user => ({
        name: typeof user === 'string' ? user : user.name,
        id: typeof user === 'string' ? null : user.id,
        email: typeof user === 'string' ? '' : (user.email || ''),
        role: typeof user === 'string' ? '' : (user.role || 'member')
      }));
      onChange(backendFormat);
    }
  };

  // Check if user is selected with unique EMAIL-based matching
  const isUserSelected = (user) => {
    // Ensure selected is always an array
    const currentSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);
    
    return currentSelected.some(s => {
      if (typeof s === 'string') {
        return s === user.name; // Legacy support
      } else {
        // Primary: Match by ID (most reliable)
        if (s.id && user.id && s.id === user.id) {
          return true;
        }
        // Secondary: Match by EMAIL if both have valid emails and no ID match
        if (s.email && user.email && s.email !== '' && user.email !== '') {
          return s.email === user.email;
        }
        // Fallback: Match by name only if no ID or email available
        if (!s.id && !user.id && (!s.email || s.email === '') && (!user.email || user.email === '')) {
          return s.name === user.name;
        }
        return false;
      }
    });
  };

  // Clear all assignments with confirmation
  const clearAll = (e) => {
    e.stopPropagation();
    setSelected([]);
    // Ensure parent component gets updated with empty array
    if (onChange) {
      onChange([]);
    }
  };

  // Enhanced compact view (for lists)
  if (compact) {
    const currentSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);
    const maxShow = 3;
    const remainingCount = Math.max(0, currentSelected.length - maxShow);

    return (
      <div className="flex items-center -space-x-1">
        {currentSelected.slice(0, maxShow).map((user, index) => {
          const userName = typeof user === 'string' ? user : user.name;
          const initials = getInitials(userName);
          const colorClass = getAvatarColor(userName);
          
          return (
            <div
              key={index}
              className={`relative w-7 h-7 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-semibold border-2 border-[#1a1a1a] shadow-lg transition-transform duration-200 hover:scale-110 hover:z-10`}
              style={{ 
                zIndex: 10 - index,
                boxShadow: `0 3px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)`
              }}
              title={userName}
            >
              {initials}
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/15 to-transparent"></div>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2c2c2c] flex items-center justify-center text-white text-xs font-bold border-2 border-[#1a1a1a] shadow-lg">
            +{remainingCount}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/15 to-transparent"></div>
          </div>
        )}
        {currentSelected.length === 0 && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2c2c2c] to-[#1f1f1f] flex items-center justify-center text-[#8a8a8a] border-2 border-[#1a1a1a] shadow-inner">
            <User size={14} className="opacity-70" />
          </div>
        )}
      </div>
    );
  }

  // Full component view
  const currentSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);

  return (
    <Popover className="relative inline-block">
      {({ close }) => (
        <>
          {/* ---------- Enhanced Trigger Button ---------- */}
          <Popover.Button
            as="div"
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer select-none assign-smooth-hover
              ${currentSelected.length > 0 
                ? "bg-gradient-to-r from-[#252525] via-[#2a2a2a] to-[#252525] border border-[#6366f1]/25 assign-glow-primary" 
                : "bg-gradient-to-r from-[#1f1f1f] to-[#252525] border border-[#2c2c2c] hover:border-[#3a3a3a]"
              } shadow-lg`}
            title={currentSelected.length > 0 ? `${currentSelected.length} assignee(s) selected` : "Click to assign team members"}
          >
            {/* Enhanced Avatar Stack with Modern Design */}
            <div className="flex items-center -space-x-1">
              {currentSelected.length > 0 ? (
                <>
                  {currentSelected.slice(0, 3).map((user, index) => {
                    const userName = typeof user === 'string' ? user : user.name;
                    const initials = getInitials(userName);
                    const colorClass = getAvatarColor(userName);
                    
                    return (
                      <div
                        key={index}
                        className={`relative w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-semibold border-2 border-[#1a1a1a] shadow-lg transition-transform duration-200 group-hover:scale-105`}
                        style={{ 
                          zIndex: 10 - index,
                          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.05)`
                        }}
                      >
                        {initials}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    );
                  })}
                  {currentSelected.length > 3 && (
                    <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs font-bold border-2 border-[#1a1a1a] shadow-lg">
                      +{currentSelected.length - 3}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2c2c2c] to-[#1f1f1f] flex items-center justify-center text-[#8a8a8a] border-2 border-[#1a1a1a] shadow-inner">
                  <User size={18} className="opacity-70" />
                </div>
              )}
              
              {/* Enhanced Add Button */}
              {currentSelected.length < 5 && (
                <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white border-2 border-[#1a1a1a] ml-2 shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Plus size={14} className="font-bold" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/10 to-white/10"></div>
                </div>
              )}
            </div>

            {/* Enhanced Text Label */}
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold">
                {currentSelected.length > 0 
                  ? `${currentSelected.length} Member${currentSelected.length !== 1 ? 's' : ''} Assigned` 
                  : "Assign Members"
                }
              </span>
              {currentSelected.length > 0 && (
                <span className="text-xs text-[#8a8a8a] font-medium">
                  {currentSelected.length >= 5 ? '🔒 Full team' : `✨ ${5 - currentSelected.length} slot${5 - currentSelected.length !== 1 ? 's' : ''} left`}
                </span>
              )}
            </div>
            
            {/* Subtle arrow indicator */}
            <div className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity duration-200">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Popover.Button>

          {/* ---------- Enhanced Dropdown Panel ---------- */}
                        <Popover.Panel className="absolute left-0 top-full mt-3 w-96 assign-glass-panel rounded-2xl shadow-2xl z-[9999] overflow-hidden transition-all duration-300 ease-out transform origin-top border border-white/10">
              {/* Enhanced Header */}
              <div className="flex justify-between items-center p-5 pb-4 border-b border-[rgba(255,255,255,0.06)] bg-gradient-to-r from-[rgba(99,102,241,0.05)] to-[rgba(139,92,246,0.03)]">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#6366f1]/15 to-[#8b5cf6]/10 border border-[#6366f1]/20 shadow-inner">
                    <User size={18} className="text-[#6366f1]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Team Assignment</h3>
                    <div className="text-xs text-[rgba(230,230,230,0.7)] mt-1 flex items-center gap-2">
                      <span className="font-medium">{currentSelected.length}/5 members assigned</span>
                      {currentSelected.length >= 5 ? (
                        <span className="px-3 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-full border border-[#f59e0b]/20 text-xs font-medium animate-pulse">
                          🔒 Maximum reached
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full border border-[#10b981]/20 text-xs font-medium">
                          ✨ {5 - currentSelected.length} slot{5 - currentSelected.length !== 1 ? 's' : ''} available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {currentSelected.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-[#ef4444] hover:text-red-300 px-4 py-2 rounded-xl hover:bg-[rgba(239,68,68,0.08)] transition-all duration-200 border border-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.25)] font-semibold backdrop-blur-sm"
                    title="Remove all assignments"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Enhanced Current Assignments Section */}
              {currentSelected.length > 0 && (
                <div className="p-5 bg-gradient-to-r from-[rgba(30,30,30,0.6)] to-[rgba(35,35,35,0.4)] border-b border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-pulse"></div>
                    <span className="text-xs text-[#6366f1] font-bold uppercase tracking-wider">
                      Currently Assigned ({currentSelected.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {currentSelected.map((user, index) => {
                      const userName = typeof user === 'string' ? user : user.name;
                      const userEmail = typeof user === 'string' ? '' : user.email;
                      const userRole = typeof user === 'string' ? '' : user.role;
                      const userId = typeof user === 'string' ? user : user.id;
                      const initials = getInitials(userName);
                      const colorClass = getAvatarColor(userName);
                      
                      // Create unique key using email first, then ID, then name with index
                      const uniqueKey = userEmail || userId || `${userName}-${index}`;
                      
                      return (
                        <div
                          key={uniqueKey}
                          className="flex items-center gap-3 bg-gradient-to-r from-[#6366f1]/8 to-[#8b5cf6]/6 border border-[#6366f1]/15 rounded-xl px-3 py-3 group hover:bg-[#6366f1]/12 hover:border-[#6366f1]/25 transition-all duration-300 assign-smooth-hover"
                        >
                          <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-bold border border-[rgba(255,255,255,0.1)] shadow-md`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm truncate">{userName}</div>
                            <div className="text-xs text-[rgba(230,230,230,0.6)] truncate">
                              {userEmail || (
                                <span className="text-orange-300 italic">
                                  ⚠️ No email provided
                                </span>
                              )}
                            </div>
                          </div>
                          {userRole && (
                            <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                              userRole === "admin" 
                                ? "bg-[rgba(239,68,68,0.15)] text-red-300 border border-[rgba(239,68,68,0.2)]"
                                : userRole === "moderator"
                                  ? "bg-[rgba(245,158,11,0.15)] text-yellow-300 border border-[rgba(245,158,11,0.2)]"
                                  : "bg-[rgba(107,114,128,0.15)] text-gray-300 border border-[rgba(107,114,128,0.2)]"
                            }`}>
                              {userRole}
                            </span>
                          )}
                          <button
                            onClick={(e) => removeUser(user, e)}
                            className="p-1.5 hover:bg-[rgba(239,68,68,0.15)] rounded-lg transition-all duration-200 hover:scale-110 opacity-60 group-hover:opacity-100 border border-transparent hover:border-[rgba(239,68,68,0.2)]"
                            title={`Remove ${userName} from assignment`}
                          >
                            <X size={14} className="text-[#ef4444]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enhanced Available Team Members */}
              <div className="p-5 max-h-80 overflow-y-auto assign-dropdown-scroll">
                {assignees.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-[rgba(230,230,230,0.5)] rounded-full"></div>
                      <span className="text-xs text-[rgba(230,230,230,0.7)] font-bold uppercase tracking-wider">
                        Available Team Members
                        {duplicateNames.length > 0 && (
                          <span className="ml-2 text-orange-300 normal-case">
                            ⚠️ Note: Some members share names or lack emails
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {(() => {
                      // Define currentSelected at the top level of this function
                      const currentSelected = Array.isArray(selected) ? selected : (selected ? [selected] : []);
                      
                      const availableUsers = assignees.filter(user => {
                        // Filter out already selected users to prevent duplicates
                        const isAlreadySelected = !currentSelected.some(s => {
                          if (typeof s === 'string') {
                            return s === user.name;
                          } else {
                            // Use EMAIL for unique identification first, then ID only if no emails
                            if (s.email && user.email && s.email !== '' && user.email !== '') {
                              const emailMatch = s.email === user.email;
                              // console.log('🔍 Available filter - Email comparison:', { 
                              //   selectedEmail: s.email, 
                              //   userEmail: user.email, 
                              //   match: emailMatch,
                              //   excluded: emailMatch
                              // });
                              return emailMatch;
                            }
                            // Only use ID if both users don't have emails
                            const idMatch = s.id && user.id && s.id === user.id;
                            // console.log('🔍 Available filter - ID comparison:', { 
                            //   selectedId: s.id, 
                            //   userId: user.id, 
                            //   match: idMatch,
                            //   excluded: idMatch
                            // });
                            return idMatch;
                          }
                        });
                        // console.log('🔍 Available filter result for user:', { 
                        //   name: user.name, 
                        //   email: user.email, 
                        //   isAvailable: isAlreadySelected 
                        // });
                        return isAlreadySelected;
                      });

                      if (availableUsers.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full flex items-center justify-center">
                              <UserCheck size={24} className="text-[#6366f1]" />
                            </div>
                            <p className="text-[rgba(230,230,230,0.8)] font-medium">All team members assigned!</p>
                            <p className="text-xs text-[rgba(230,230,230,0.5)] mt-1">Maximum 5 assignments reached</p>
                          </div>
                        );
                      }

                      return availableUsers.map((user) => {
                        const isSelected = isUserSelected(user);
                        const initials = getInitials(user.name);
                        const colorClass = getAvatarColor(user.name);
                        const canSelect = !isSelected && currentSelected.length < 5;
                      
                      return (
                        <div
                          key={user.email || user.id || `${user.name}-available`}
                          onClick={() => {
                            const isSelected = isUserSelected(user);
                            if (isSelected || currentSelected.length < 5) {
                              handleToggleUser(user);
                            }
                          }}
                          className={`flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-300 ${
                            isSelected 
                              ? "bg-gradient-to-r from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.1)] border border-[rgba(99,102,241,0.25)] cursor-pointer assign-glow-primary" 
                              : currentSelected.length < 5
                                ? "hover:bg-[rgba(255,255,255,0.04)] border border-transparent hover:border-[rgba(255,255,255,0.08)] cursor-pointer assign-smooth-hover"
                                : "opacity-50 cursor-not-allowed border border-transparent bg-[rgba(255,255,255,0.01)]"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`relative w-12 h-12 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-base border border-[rgba(255,255,255,0.1)] shadow-lg`}>
                              {initials}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#10b981] rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`font-bold text-base truncate ${isSelected ? "text-blue-300" : "text-white"}`}>
                                  {user.name}
                                  {duplicateNames.includes(user.name) && (
                                    <span className="ml-2 text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
                                      ⚠️ Duplicate name
                                    </span>
                                  )}
                                  {!user.email && (
                                    <span className="ml-2 text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                                      ⚠️ No email
                                    </span>
                                  )}
                                </span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                                  user.role === "admin" 
                                    ? "bg-[rgba(239,68,68,0.15)] text-red-300 border border-[rgba(239,68,68,0.2)]"
                                    : user.role === "moderator"
                                      ? "bg-[rgba(245,158,11,0.15)] text-yellow-300 border border-[rgba(245,158,11,0.2)]"
                                      : "bg-[rgba(107,114,128,0.15)] text-gray-300 border border-[rgba(107,114,128,0.2)]"
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                              <div className={`text-sm truncate font-medium ${isSelected ? "text-blue-200" : "text-[rgba(230,230,230,0.8)]"} ${
                                duplicateNames.includes(user.name) ? 'text-orange-200 font-semibold' : ''
                              }`}>
                                {duplicateNames.includes(user.name) && '📧 '}
                                {user.email || (
                                  <span className="text-orange-300 italic">
                                    ⚠️ No email provided
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isSelected ? (
                              <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.25)] rounded-lg">
                                <UserCheck size={16} className="text-[#10b981]" />
                                <span className="text-sm text-[#10b981] font-semibold">Assigned</span>
                              </div>
                            ) : (
                              <div className={`p-2 rounded-lg border transition-all duration-200 ${
                                currentSelected.length < 5 
                                  ? "bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.15)]" 
                                  : "bg-[rgba(107,114,128,0.1)] border-[rgba(107,114,128,0.2)]"
                              }`}>
                                <Plus size={16} className={`${currentSelected.length < 5 ? "text-[#10b981]" : "text-[#6b7280]"}`} />
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#2c2c2c] to-[#1f1f1f] flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
                      <User size={24} className="text-[#8a8a8a]" />
                    </div>
                    <div className="text-white font-semibold text-base mb-2">No Team Members Found</div>
                    <div className="text-sm text-[rgba(230,230,230,0.6)] max-w-xs mx-auto">
                      Add team members to your workspace to assign tasks and collaborate effectively.
                    </div>
                  </div>
                )}
              </div>
            </Popover.Panel>
        </>
      )}
    </Popover>
  );
};

export default AssignBugBadge;
