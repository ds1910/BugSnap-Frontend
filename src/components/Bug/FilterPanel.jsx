import React, { useState } from "react";
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
} from "lucide-react"; // Icons for dropdowns & buttons

import CalendarDropdown from "../UI/CalendarDropdown"; // Custom date picker component

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
  // Local state
  // -------------------------
  const [open, setOpen] = useState(false); // Controls visibility of filter panel
  const [filters, setFilters] = useState([{ id: 1, field: "", value: "", condition: "AND" }]); // Array of filter objects

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
  const fieldValueOptions = {
    Status: ["open", "in-progress", "resolved", "closed"],
    Priority: ["low", "medium", "high", "critical"],
    Tags: ["frontend", "backend", "bug", "feature", "ui", "api"],
    Assignee: ["User A", "User B", "User C"],
    "Created by": ["User A", "User B", "User C"],
    "Start date": [],
    "Due date": [],
    "Date created": [],
    "Date closed": [],
  };

  // -------------------------
  // Helper functions
  // -------------------------
  const addFilter = () => {
    setFilters([...filters, { id: Date.now(), field: "", value: "", condition: "AND" }]); // Add new empty filter
  };

  const removeFilter = (id) => {
    setFilters(filters.filter((f) => f.id !== id)); // Remove filter by id
  };

  const clearFilters = () => {
    setFilters([{ id: 1, field: "", value: "", condition: "AND" }]); // Reset to default
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
          
          {/* Header with Clear and Saved Filters buttons */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-white">Filters</span>
            <div className="flex gap-3">
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-400">
                Clear all
              </button>
              <button className="text-xs text-gray-400 hover:text-white">
                Saved filters ▾
              </button>
            </div>
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
                    onChange={(val) =>
                      setFilters(
                        filters.map((f) =>
                          f.id === filter.id ? { ...f, condition: val } : f
                        )
                      )
                    }
                    width="w-24"
                  />
                )}

                {/* Field Selector */}
                <CustomDropdown
                  value={filter.field || "Select field"}
                  options={filterOptions.map((opt) => opt.name)}
                  onChange={(val) =>
                    setFilters(
                      filters.map((f) =>
                        f.id === filter.id ? { ...f, field: val, value: "" } : f
                      )
                    )
                  }
                  withIcons={filterOptions}
                />

                {/* Value Selector */}
                {filter.field && fieldValueOptions[filter.field]?.length > 0 ? (
                  <CustomDropdown
                    value={filter.value || "Select value"}
                    options={fieldValueOptions[filter.field]}
                    onChange={(val) =>
                      setFilters(
                        filters.map((f) =>
                          f.id === filter.id ? { ...f, value: val } : f
                        )
                      )
                    }
                  />
                ) : ["Start date", "Due date", "Date created", "Date closed"].includes(filter.field) ? (
                  <CalendarDropdown
                    selectedDate={filter.value}
                    onDateChange={(date) =>
                      setFilters(
                        filters.map((f) =>
                          f.id === filter.id ? { ...f, value: date } : f
                        )
                      )
                    }
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
 */
const CustomDropdown = ({ value, options, onChange, withIcons, width = "w-40" }) => (
  <Menu as="div" className={`relative inline-block text-left ${width}`}>
    <Menu.Button className="flex items-center justify-between w-full px-3 py-2 bg-[#2C2C2C] 
      text-sm text-white hover:bg-[#454545] transition-all rounded-lg">
      {value}
      <ChevronDown size={16} className="ml-2 text-gray-300" />
    </Menu.Button>
    <Menu.Items className="absolute mt-2 w-full origin-top-left bg-[#1E1E1E] border border-[#505050] shadow-lg focus:outline-none rounded-lg z-30">
      {options.map((opt) => {
        const isSelected = value === opt;
        const icon = withIcons?.find((i) => i.name === opt)?.icon;
        return (
          <Menu.Item key={opt}>
            {({ active }) => (
              <button
                onClick={() => onChange(opt)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-lg
                  ${isSelected ? "bg-[#2C2C2C] text-white" : active ? "bg-[#3A3A3A] text-white" : "text-gray-300"}`}>
                <div className="flex items-center gap-3">
                  {icon && icon}
                  <span>{opt}</span>
                </div>
                {isSelected && <Check size={16} />}
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
