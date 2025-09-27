import React from "react";
import { Home, Users, UserSquare2 } from "lucide-react";

const items = [
  { label: "Home", value: "home", icon: <Home className="w-6 h-6" /> },
  { label: "People", value: "people", icon: <Users className="w-6 h-6" /> },
  { label: "Teams", value: "teams", icon: <UserSquare2 className="w-6 h-6" /> },
];

const Navigbar = ({ selected, onSelect }) => (
  <div className="space-y-0.5">
    {items.map((item) => (
      <div
        key={item.value}
        className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded-lg transition-colors duration-200 hover:bg-[#3a3a3a] group ${
          selected === item.value ? "bg-[#3a3a3a]" : ""
        }`}
        onClick={() => onSelect(item.value)}
      >
        <div className="w-9 h-9 flex items-center justify-center rounded-xl shadow-md transition-colors duration-200 group-hover:bg-[#3a3a3a]">
          <div className="text-gray-400 group-hover:text-gray-200 transition-colors duration-200">
            {item.icon}
          </div>
        </div>
        <span className="text-gray-400 font-medium text-base group-hover:text-gray-200 transition-colors duration-200">
          {item.label}
        </span>
      </div>
    ))}
  </div>
);

export default Navigbar;