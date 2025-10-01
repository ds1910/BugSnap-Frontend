import React, { useState, useEffect } from "react";
import { Menu } from "@headlessui/react"; // Headless UI for accessible dropdowns
import {
  ChevronDown,
  Trash2,
  Check,
  User,
  Flag,
  Tag,
  Calendar,
  UserCircle,
  Clock,
  Loader2,
  AlertCircle,
  Filter,
  X,
} from "lucide-react"; // Icons for dropdowns & buttons
import CalendarDropdown from "../UI/CalendarDropdown"; // Custom date picker component
import { useSearchFilter } from "./SearchFilterContext"; // Import the context
import axios from "axios"; // For API calls

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/**
 * FilterPanel Component
 * --------------------
 * Displays a collapsible panel for filtering tasks/bugs.
 * Supports multiple filters with AND/OR logic, field selection, value selection, and date picking.
 * Features:
 * 1. Add / remove filters dynamically
 * 2. Clear all filters
 * 3. Dropdowns with icons
 * 4. Calendar picker for date fields
 */
const FilterPanel = () => {
  // -------------------------
  // Context state
  // -------------------------
  const { 
    filters, 
    updateFilters, 
    addFilter, 
    removeFilter, 
    clearFilters 
  } = useSearchFilter();

  // -------------------------
  // Local state
  // -------------------------
  const [open, setOpen] = useState(false); // Controls visibility of filter panel
  const [users, setUsers] = useState([]); // Real users from API
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state
  const [usersFetchError, setUsersFetchError] = useState(false); // Error state

  // -------------------------
  // Fetch users from API when component mounts
  // -------------------------
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setUsersFetchError(false);
        
        const activeTeamString = localStorage.getItem("activeTeam");
        if (!activeTeamString) {
          console.warn("No active team found in localStorage");
          setUsersFetchError(true);
          return;
        }

        const activeTeam = JSON.parse(activeTeamString);

        const response = await axios.post(
          `${backendUrl}/team/members`,
          { teamId: activeTeam._id },
          { 
            withCredentials: true // Use cookies for authentication
          }
        );

        // Extract user names from the response
        const userNames = (response.data.members || []).map(member => member.name);
        
        if (userNames.length === 0) {
          console.warn("No team members found");
          setUsers(["No users found"]);
        } else {
          setUsers(userNames);
        }
      } catch (error) {
        console.error("Failed to fetch users for filters:", error);
        setUsersFetchError(true);
        // Set fallback message on error
        setUsers(["Unable to load users"]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // -------------------------
  // Available filter fields with icons
  // -------------------------
  const filterOptions = [
    { name: "Status", icon: <CircleIcon /> },
    { name: "Priority", icon: <Flag size={16} /> },
    { name: "Tags", icon: <Tag size={16} /> },
    { name: "Assignee", icon: <User size={16} /> },
    { name: "Created by", icon: <UserCircle size={16} /> },
    { name: "Start date", icon: <Calendar size={16} /> },
    { name: "Due date", icon: <Calendar size={16} /> },
    { name: "Date created", icon: <Clock size={16} /> },
    { name: "Date closed", icon: <Clock size={16} /> },
  ];

  // Predefined options for each field
  const getUserOptions = () => {
    if (loadingUsers) return ["Loading..."];
    if (usersFetchError) return ["Unable to load users"];
    if (users.length === 0) return ["No users found"];
    return users;
  };

  const fieldValueOptions = {
    Status: ["Open", "In Progress", "Resolved", "Closed"],
    Priority: ["Low", "Medium", "High", "Critical"],
    Tags: ["frontend", "backend", "bug", "feature", "ui", "api"],
    Assignee: getUserOptions(),
    "Created by": getUserOptions(),
    "Start date": [],
    "Due date": [],
    "Date created": [],
    "Date closed": [],
  };

  // -------------------------
  // Helper functions
  // -------------------------
  const updateFilter = (id, field, value) => {
    const newFilters = filters.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    );
    updateFilters(newFilters);
  };

  const updateFilterCondition = (id, condition) => {
    const newFilters = filters.map(filter => 
      filter.id === id ? { ...filter, condition } : filter
    );
    updateFilters(newFilters);
  };

  return (
    <div className="relative inline-block">
      {/* -------------------------
          Filter button
          Toggle panel visibility
      ------------------------- */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-[#3A3A3A] border border-[#505050] rounded-lg cursor-pointer 
                   transition-all duration-200 hover:bg-[#454545] hover:shadow-md hover:border-[#606060]">
        <span className="text-sm font-medium text-white">Filter</span>
        <ChevronDown
          size={16}
          className={`text-white transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>

      {/* -------------------------
          Filter Panel
          Only visible when open === true
      ------------------------- */}
      {open && (
        <div className="absolute right-0 mt-7 w-[650px] bg-[#2C2C2C] border border-[#505050] rounded-lg shadow-lg p-4 z-20">
          
          {/* Header with Clear button */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-white">Filters</span>
            </div>
            <button 
              onClick={clearFilters} 
              className="text-xs text-gray-400 hover:text-red-400 transition-colors duration-200 flex items-center gap-1"
            >
              <X size={12} />
              Clear all
            </button>
          </div>

          {/* -------------------------
              Filter Blocks
              Dynamically rendered for each filter
          ------------------------- */}
          <div className="flex flex-col gap-3">
            {filters.map((filter, index) => (
              <div
                key={filter.id}
                className="flex items-center gap-2 bg-[#3A3A3A] border border-[#505050] rounded-md px-2 py-2">

                {/* AND / OR Selector for 2nd+ filters */}
                {index > 0 && (
                  <CustomDropdown 
                    value={filter.condition}
                    options={["AND", "OR"]}
                    onChange={(val) => updateFilterCondition(filter.id, val)}
                    width="w-24"
                  />
                )}

                {/* Field Selector */}
                <CustomDropdown
                  value={filter.field || "Select field"}
                  options={filterOptions.map((opt) => opt.name)}
                  onChange={(val) => updateFilter(filter.id, 'field', val)}
                  withIcons={filterOptions}
                />

                {/* Value Selector */}
                {filter.field && fieldValueOptions[filter.field]?.length > 0 ? (
                  <CustomDropdown
                    value={filter.value || "Select value"}
                    options={fieldValueOptions[filter.field]}
                    onChange={(val) => updateFilter(filter.id, 'value', val)}
                    isLoading={loadingUsers && (filter.field === "Assignee" || filter.field === "Created by")}
                    isError={usersFetchError && (filter.field === "Assignee" || filter.field === "Created by")}
                  />
                ) : ["Start date", "Due date", "Date created", "Date closed"].includes(filter.field) ? (
                  <CalendarDropdown
                    selectedDate={filter.value}
                    onDateChange={(date) => updateFilter(filter.id, 'value', date)}
                  />
                ) : null}

                {/* Delete Filter Button (only if more than 1 filter) */}
                {filters.length > 1 && (
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-gray-400 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Filter Button */}
          <button
            onClick={addFilter}
            className="mt-4 w-full px-3 py-2 text-sm font-medium text-white bg-[#3A3A3A] border border-[#505050] rounded-md hover:bg-[#454545]">
            + Add filter
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * CustomDropdown Component
 * ------------------------
 * Reusable dropdown for field, value, and condition selection
 * Props:
 * - value: currently selected value
 * - options: array of string options
 * - onChange: callback when selection changes
 * - withIcons: optional, array of {name, icon} objects for icons
 * - width: Tailwind width class
 * - isLoading: show loading state for user-related fields
 * - isError: show error state for user-related fields
 */
const CustomDropdown = ({ value, options, onChange, withIcons, width = "w-40", isLoading = false, isError = false }) => (
  <Menu as="div" className={`relative inline-block text-left ${width}`}>
    <Menu.Button className="flex items-center justify-between w-full px-3 py-2 bg-[#2C2C2C] 
      text-sm text-white hover:bg-[#454545] transition-all rounded-lg">
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 size={14} className="animate-spin text-blue-400" />}
        {isError && <AlertCircle size={14} className="text-red-400" />}
        <span>{value}</span>
      </div>
      <ChevronDown size={16} className="ml-2 text-gray-300" />
    </Menu.Button>
    <Menu.Items className="absolute mt-2 w-full origin-top-left bg-[#1E1E1E] border border-[#505050] shadow-lg focus:outline-none rounded-lg z-30">
      {options.map((opt) => {
        const isSelected = value === opt;
        const icon = withIcons?.find((i) => i.name === opt)?.icon;
        const isSpecialItem = ["Loading...", "Unable to load users", "No users found"].includes(opt);
        
        return (
          <Menu.Item key={opt} disabled={isSpecialItem}>
            {({ active }) => (
              <button
                onClick={() => !isSpecialItem && onChange(opt)}
                disabled={isSpecialItem}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-lg
                  ${isSpecialItem 
                    ? "bg-[#1E1E1E] text-gray-500 cursor-not-allowed" 
                    : isSelected 
                      ? "bg-[#2C2C2C] text-white" 
                      : active 
                        ? "bg-[#3A3A3A] text-white" 
                        : "text-gray-300"
                  }`}>
                <div className="flex items-center gap-3">
                  {opt === "Loading..." ? (
                    <Loader2 size={14} className="animate-spin text-blue-400" />
                  ) : opt === "Unable to load users" ? (
                    <AlertCircle size={14} className="text-red-400" />
                  ) : opt === "No users found" ? (
                    <User size={14} className="text-gray-500" />
                  ) : (
                    icon && icon
                  )}
                  <span>{opt}</span>
                </div>
                {isSelected && !isSpecialItem && <Check size={16} />}
              </button>
            )}
          </Menu.Item>
        );
      })}
    </Menu.Items>
  </Menu>
);

// Custom circle icon for Status field
const CircleIcon = () => <div className="w-4 h-4 rounded-full border border-gray-400" />;

export default FilterPanel;
