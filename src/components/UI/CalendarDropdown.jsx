import { Popover } from "@headlessui/react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
} from "lucide-react";
import { useState, useEffect } from "react";

/* ---------- Helpers ---------- */

// Check if two dates are the same day
const isSameDay = (a, b) =>
  a &&
  b &&
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

// Generate weeks for a given month/year
const getWeeks = (month, year) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks = [];
  let currentWeek = [];
  let day = new Date(firstDay);

  // start from previous Sunday
  day.setDate(day.getDate() - day.getDay());

  while (day <= lastDay || day.getDay() !== 0) {
    currentWeek.push({
      date: new Date(day),
      outside: day.getMonth() !== month,
    });

    if (day.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    day.setDate(day.getDate() + 1);
  }

  return weeks;
};

// Format for display: DD/MM/YYYY
const formatDisplay = (date) => {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

// Format for storing: YYYY-MM-DD
const formatStore = (date) => {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Robust parse for date strings: DD/MM/YYYY, YYYY-MM-DD, ISO
const parseDateString = (value) => {
  if (!value) return null;

  // 1. DD/MM/YYYY (prioritize this so 04/09/2025 = 4 Sept, not Apr 9)
  const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (dm) {
    const dd = Number(dm[1]);
    const mm = Number(dm[2]);
    const yyyy = Number(dm[3]);
    const d3 = new Date(yyyy, mm - 1, dd);
    if (!isNaN(d3.getTime())) return d3;
  }

  // 2. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(value + "T00:00:00"); // prevent timezone shift
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Fallback (ISO, etc.)
  const d2 = new Date(value);
  if (!isNaN(d2.getTime())) return d2;

  return null;
};

/* ---------- CalendarDropdown Component ---------- */

const CalendarDropdown = ({
  value, // string (parent value, prefer "" or "YYYY-MM-DD" or "DD/MM/YYYY")
  onChange, // (dateString) => ...
  bgColor = "bg-[#1E1E1E]",
  hoverBgColor = "hover:bg-[#2D2D2D]",
}) => {
  const today = new Date();
//  console.log("value:", value);
  const parsedInitial = parseDateString(value) || today;
 // console.log("parsedInitial:", parsedInitial);

  const [selectedDate, setSelectedDate] = useState(parsedInitial);
  const [month, setMonth] = useState(parsedInitial.getMonth());
  const [year, setYear] = useState(parsedInitial.getFullYear());

  // Sync when parent value changes
  useEffect(() => {
    const p = parseDateString(value) || today;
    setSelectedDate(p);
    setMonth(p.getMonth());
    setYear(p.getFullYear());
  }, [value]);

  const weeks = getWeeks(month, year);

  const handlePick = (date, outside) => {
    if (outside) return;
    setSelectedDate(date);
    onChange?.(formatStore(date));
  };

  const clearDate = () => {
    setSelectedDate(today);
    onChange?.(formatStore(today));
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  return (
    <Popover className="relative inline-block">
      {/* Trigger */}
      <Popover.Button
        as="div"
        className="w-44 flex items-center justify-between px-3 py-2
                   bg-[#2C2C2C] border border-[#505050]
                   text-sm text-white rounded-lg hover:bg-[#454545] cursor-pointer"
      >
        <span>{formatDisplay(selectedDate)}</span>
        <div className="flex items-center space-x-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              clearDate();
            }}
            className="p-0.5 rounded hover:bg-[#3a3a3a] cursor-pointer"
            title="Reset to today"
          >
            <XIcon size={14} className="text-gray-300" />
          </div>
          <CalendarIcon size={16} className="text-gray-300" />
        </div>
      </Popover.Button>

      {/* Panel */}
      <Popover.Panel
        className={`absolute mt-2 ${bgColor} border border-[#505050]
                   rounded-lg shadow-lg z-40 p-3 w-96`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div
            onClick={() => {
              if (month === 0) {
                setMonth(11);
                setYear(year - 1);
              } else setMonth(month - 1);
            }}
            className="p-1 hover:bg-[#2D2D2D] rounded cursor-pointer"
          >
            <ChevronLeft size={16} className="text-gray-300" />
          </div>

          <span className="text-white font-medium">
            {new Date(year, month).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <div
            onClick={() => {
              if (month === 11) {
                setMonth(0);
                setYear(year + 1);
              } else setMonth(month + 1);
            }}
            className="p-1 hover:bg-[#2D2D2D] rounded cursor-pointer"
          >
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 text-sm text-gray-400 mb-3">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
            <div key={`weekday-${index}-${d}`} className="flex justify-center font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-7 gap-x-2 gap-y-2">
          {weeks.flat().map(({ date: d, outside }, idx) => {
            const isToday = isSameDay(d, today);
            const isSel = selectedDate && isSameDay(d, selectedDate);

            const base =
              "h-10 w-10 flex items-center justify-center text-sm select-none rounded-[6px] transition cursor-pointer";
            let bg = "";
            if (isSel) bg = "bg-blue-600 text-white";
            else if (isToday) bg = "bg-red-600 text-white";
            else
              bg = outside
                ? `text-gray-500 ${bgColor}`
                : `text-white ${hoverBgColor} ${bgColor}`;

            return (
              <div
                key={idx}
                onClick={() => handlePick(d, outside)}
                className={`${base} ${bg}`}
              >
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </Popover.Panel>
    </Popover>
  );
};

export default CalendarDropdown;
