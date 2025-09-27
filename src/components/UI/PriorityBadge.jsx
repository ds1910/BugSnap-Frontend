import { Popover } from "@headlessui/react";
import { Flag } from "lucide-react";
import { useState, useEffect } from "react";

/* ---------- Priority Options ---------- */
const priorities = [
  { label: "Low", color: "bg-green-500", hover: "hover:bg-green-600" },
  { label: "Medium", color: "bg-yellow-500", hover: "hover:bg-yellow-600" },
  { label: "High", color: "bg-orange-500", hover: "hover:bg-orange-600" },
  { label: "Critical", color: "bg-red-600", hover: "hover:bg-red-700" },
];

/* ---------- PriorityDropdown Component ---------- */
const PriorityDropdown = ({ value, onChange }) => {
  const getInitial = (val) =>
    priorities.find((p) => p.label.toLowerCase() === val?.toLowerCase()) || null;

  const [selected, setSelected] = useState(() => getInitial(value));

  useEffect(() => {
    setSelected(getInitial(value));
  }, [value]);

  const handleSelect = (priority, close) => {
    setSelected(priority);
    onChange?.(priority.label);
    close?.();
  };

  return (
    <Popover className="relative inline-block">
      {({ close }) => (
        <>
          {/* ---------- Popover Trigger ---------- */}
          <Popover.Button as="div" className="cursor-pointer">
            {!selected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 ">
                <Flag size={20} className="text-gray-300" />
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg 
                            ${selected.color} text-white font-medium transition 
                            ${selected.hover}`}
              >
                <Flag size={20} className="text-white" />
                <span className="text-base">{selected.label}</span>
              </div>
            )}
          </Popover.Button>

          {/* ---------- Dropdown Panel ---------- */}
          <Popover.Panel
            className="absolute mt-2 w-44 bg-[#1E1E1E] border border-[#505050]
                       rounded-lg shadow-lg z-40 p-2"
          >
            {priorities.map((p) => (
              <div
                key={p.label}
                onClick={() => handleSelect(p, close)}
                className={`flex items-center gap-2 w-full px-2 py-2 text-base 
                           rounded-md cursor-pointer transition text-white ${p.hover}`}
              >
                <Flag size={18} className={p.color.replace("bg", "text")} />
                <span className={`${p.color.replace("bg", "text")} font-medium`}>
                  {p.label}
                </span>
              </div>
            ))}
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};

export default PriorityDropdown;
