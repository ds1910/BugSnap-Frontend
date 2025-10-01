import React, { useState } from "react";
import { Menu } from "@headlessui/react";
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
} from "lucide-react";
import FilterPanel from "./FilterPanel";
import { useSearchFilter } from "./SearchFilterContext";

const ActionBar = () => {
  const { 
    groupBy, 
    order, 
    updateGroupBy, 
    updateOrder, 
    resetAll,
    hasActiveFilters,
    searchQuery
  } = useSearchFilter();

  const [openGroup, setOpenGroup] = useState(false);

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

  const orderOptions = ["Ascending", "Descending"];

  const handleReset = () => {
    updateGroupBy("Assignee");
    updateOrder("Descending");
  };

  return (
    <div className="flex items-center justify-between px-3 h-[50px] border-b border-[#707070] bg-[#2C2C2C]">
      <div className="flex items-center gap-3">
        <div className="relative inline-block">
          <div
            onClick={() => setOpenGroup(!openGroup)}
            className="flex items-center gap-7 px-3 py-2 bg-[#3A3A3A] border border-[#505050] rounded-lg cursor-pointer 
                       transition-all duration-200 hover:bg-[#454545] hover:shadow-md hover:border-[#606060]"
          >
            <span className="text-sm font-medium text-white">Group</span>
            <ChevronDown
              size={16}
              className={`text-white transition-transform duration-200 ${
                openGroup ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>

          {openGroup && (
            <div className="absolute mt-7 w-[500px] bg-[#2C2C2C] border border-[#505050] rounded-lg shadow-lg p-4 z-10">
              <div className="flex items-center gap-6">
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
                              onClick={() => updateGroupBy(option.name)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors rounded-lg
                                ${
                                  groupBy === option.name
                                    ? "bg-[#2C2C2C] text-white"
                                    : active
                                    ? "bg-[#3A3A3A] text-white"
                                    : "text-gray-300"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {option.icon}
                                <span>{option.name}</span>
                              </div>
                              {groupBy === option.name && <Check size={16} />}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Menu>
                </div>

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
                              onClick={() => updateOrder(option)}
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
                              {order === option && <Check size={16} />}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Menu>
                </div>

                <button
                  onClick={handleReset}
                  className="self-end mb-1 p-2 text-gray-400 hover:text-red-400"
                  title="Reset Group & Order"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <div className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full">
              Search: "{searchQuery.substring(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
            </div>
          )}
          
          {hasActiveFilters && (
            <div className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
              Filters Active
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {(searchQuery || hasActiveFilters || groupBy !== "Assignee" || order !== "Descending") && (
          <button
            onClick={resetAll}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            title="Reset All Filters"
          >
            Reset All
          </button>
        )}
        
        <div className="relative inline-block">
          <FilterPanel />
        </div>
      </div>
    </div>
  );
};

const CircleIcon = () => (
  <div className="w-4 h-4 rounded-full border border-gray-400" />
);

export default ActionBar;