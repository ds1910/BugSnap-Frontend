import React, { useState } from "react";
import { MessageCircle, Trash2, Copy } from "lucide-react";

/**
 * PeopleCard
 * Polished card with gradient accents + minimal clean UI
 */
const PeopleCard = ({ person, onMessage, onDelete, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!person?.email) return;
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      onCopy?.(person.email);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      onCopy?.("Unable to copy");
    }
  };

  return (
    <div
      className="bg-zinc-800/70 rounded-2xl shadow-lg p-6 w-[23rem]
                 border border-zinc-700 hover:border-blue-500
                 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-2
                 relative overflow-hidden group cursor-pointer"
      aria-label={`Person ${person.name}`}
    >
      {/* Accent strip (like TeamCard vibe) */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-purple-500 to-blue-400 opacity-90" />

      <div className="flex items-start gap-4 relative">
        {/* Avatar */}
        <div
          className="w-14 h-14 flex items-center justify-center rounded-full 
                     bg-gradient-to-br from-blue-500 to-purple-600 
                     text-white font-bold text-lg shadow-md flex-shrink-0"
        >
          {person.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "U"}
        </div>

        {/* Info Section */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white leading-tight group-hover:text-blue-300 transition-colors">
                {person.name}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{person.role}</p>
            </div>
          </div>

          {/* Email Row */}
          <div className=" mt-3 flex items-center ">
            <div className=" mr-10 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/80 text-gray-200 text-sm max-w-[12rem] truncate">
              {person.email}
            </div>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className=" flex items-center justify-center p-2 rounded-full bg-zinc-700/40 hover:bg-zinc-600 
                         text-gray-300 hover:text-white transition-colors duration-200"
              title="Copy email"
              aria-label={`Copy email of ${person.name}`}
            >
              <Copy size={16} />
            </button>

            {/* Copied Indicator */}
            {copied && (
              <span className="ml-2 text-xs text-green-400 font-medium">
                Copied
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => onMessage(person)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                         hover:bg-blue-700 hover:shadow-md transition transform hover:scale-[1.03] 
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <MessageCircle size={16} />
              <span className="text-sm font-medium">Message</span>
            </button>

            <button
              onClick={() => onDelete(person)}
              className="ml-auto p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white 
                         transition-colors duration-200"
              aria-label={`Delete ${person.name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleCard;
