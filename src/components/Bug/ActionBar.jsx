import React, { useState } from "react";
import { Menu } from "@headlessui/react"; // Headless UI Menu for accessible dropdowns
import {
  ChevronDown,
  Trash2,
  Check,
  User,
  Flag,
  Tag,
  Calendar,
  Box,
  UserCircle,
  Clock,
} from "lucide-react"; // Icon library for UI visuals
import FilterPanel from "./FilterPanel"; // Component for filtering tasks

/**
 * ActionBar Component
 * -------------------
 * Displays the top bar above task lists with:
 * 1. Group dropdown (group tasks by fields like Assignee, Status, Priority)
 * 2. Order dropdown (Ascending / Descending)
 * 3. Reset button for group/order
 * 4. Filter dropdown panel
 *
 * Usage: Place above task/bug tables to control sorting & filtering.
 */
const ActionBar = () => {
  // -------------------------
  // Local state
  // -------------------------
  const [openGroup, setOpenGroup] = useState(false); // Controls visibility of Group dropdown
  const [groupBy, setGroupBy] = useState("Assignee"); // Selected "group by" field
  const [order, setOrder] = useState("Descending"); // Selected order

  // -------------------------
  // Dropdown options
  // -------------------------
  // Each group option has a name + icon
  const groupOptions = [
    { name: "Status", icon: <CircleIcon /> },
    { name: "Assignee", icon: <User size={16} /> },
    { name: "Priority", icon: <Flag size={16} /> },
    { name: "Tags", icon: <Tag size={16} /> },
    { name: "Due date", icon: <Calendar size={16} /> },
    { name: "Task type", icon: <Box size={16} /> },
    { name: "Created by", icon: <UserCircle size={16} /> },
    { name: "Date closed", icon: <Clock size={16} /> },
    { name: "Date created", icon: <Clock size={16} /> },
  ];

  // Order options
  const orderOptions = ["Ascending", "Descending"];

  return (
    <div className="flex items-center justify-between px-3 h-[50px] border-b border-[#707070] bg-[#2C2C2C]">
      {/* -------------------------
          Left side - Group dropdown button + panel
      ------------------------- */}
      <div className="relative inline-block">
        {/* Group button */}
        <div
          onClick={() => setOpenGroup(!openGroup)} // Toggle dropdown visibility
          className="flex items-center gap-7 px-3 py-2 bg-[#3A3A3A] border border-[#505050] rounded-lg cursor-pointer 
                     transition-all duration-200 hover:bg-[#454545] hover:shadow-md hover:border-[#606060]"
        >
          <span className="text-sm font-medium text-white">Group</span>
          <ChevronDown
            size={16}
            className={`text-white transition-transform duration-200 ${
              openGroup ? "rotate-180" : "rotate-0"
            }`} // Rotate icon when dropdown is open
          />
        </div>

        {/* Dropdown panel - only visible if openGroup === true */}
        {openGroup && (
          <div className="absolute mt-7 w-[500px] bg-[#2C2C2C] border border-[#505050] rounded-lg shadow-lg p-4 z-10">
            <div className="flex items-center gap-6">
              {/* -------------------------
                  Group by field
                  Headless UI Menu ensures accessible dropdown
              ------------------------- */}
              <div className="flex-1 flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Group by</label>
                <Menu as="div" className="relative inline-block text-left w-full">
                  <Menu.Button className="flex items-center justify-between w-full px-3 py-2 bg-[#3A3A3A] 
                   text-sm text-white hover:bg-[#454545] transition-all rounded-lg">
                    {groupBy}
                    <ChevronDown size={16} className="ml-2 text-gray-300" />
                  </Menu.Button>
                  <Menu.Items className="absolute mt-2 w-full origin-top-left bg-[#1E1E1E] border border-[#505050] shadow-lg focus:outline-none rounded-lg">
                    {groupOptions.map((option) => (
                      <Menu.Item key={option.name}>
                        {({ active }) => (
                          <button
                            onClick={() => setGroupBy(option.name)} // update selected group
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-lg
                              ${
                                groupBy === option.name
                                  ? "bg-[#2C2C2C] text-white" // currently selected
                                  : active
                                  ? "bg-[#3A3A3A] text-white" // hover state
                                  : "text-gray-300" // default
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {option.icon} {/* Icon for the field */}
                              <span>{option.name}</span>
                            </div>
                            {groupBy === option.name && <Check size={16} />} {/* Checkmark for selected */}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>

              {/* -------------------------
                  Order field
                  Similar structure as Group by
              ------------------------- */}
              <div className="flex-1 flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Order</label>
                <Menu as="div" className="relative inline-block text-left w-full">
                  <Menu.Button className="flex items-center justify-between w-full px-3 py-2 bg-[#3A3A3A] text-sm text-white hover:bg-[#454545] transition-all rounded-lg">
                    {order}
                    <ChevronDown size={16} className="ml-2 text-gray-300" />
                  </Menu.Button>
                  <Menu.Items className="absolute mt-2 w-full origin-top-left bg-[#1E1E1E] border border-[#505050] shadow-lg focus:outline-none rounded-lg">
                    {orderOptions.map((option) => (
                      <Menu.Item key={option}>
                        {({ active }) => (
                          <button
                            onClick={() => setOrder(option)} // update selected order
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-lg
                              ${
                                order === option
                                  ? "bg-[#2C2C2C] text-white"
                                  : active
                                  ? "bg-[#3A3A3A] text-white"
                                  : "text-gray-300"
                              }`}
                          >
                            {option}
                            {order === option && <Check size={16} />} {/* Checkmark for selected */}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>

              {/* -------------------------
                  Reset button
                  Resets groupBy & order to default values
                  Uses Trash2 icon and hover effect
              ------------------------- */}
              <button
                onClick={() => {
                  setGroupBy("Assignee");
                  setOrder("Descending");
                }}
                className="self-end mb-1 p-2 text-gray-400 hover:text-red-400"
                title="Reset"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------
          Right side - Filter dropdown
          FilterPanel handles its own state & options
      ------------------------- */}
      <div className="relative inline-block">
        <FilterPanel />
      </div>
    </div>
  );
};

// -------------------------
// Custom Circle icon for "Status" option in group dropdown
// -------------------------
const CircleIcon = () => (
  <div className="w-4 h-4 rounded-full border border-gray-400" />
);

export default ActionBar;
