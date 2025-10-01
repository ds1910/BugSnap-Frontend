import React from "react";
import { LogOut } from "lucide-react"; // Logout icon
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BottomBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    axios
      .post("http://localhost:8019/api/logout", {}, { withCredentials: true })
      .then(() => {
        // Clear user info from local storage (but not tokens - they're in HTTP-only cookies)
        localStorage.removeItem("isAuth");
        localStorage.removeItem("userInfo");

        // Redirect to login page
        navigate("/login", { replace: true });
      })
      .catch((err) => console.error("Logout failed", err));
  };

  return (
    <div
      className="w-full flex"
      style={{ backgroundColor: "#2C2C2C" }}
    >
      {/* ================= */}
      {/* Logout Section */}
      {/* ================= */}
      <div
        onClick={handleLogout}
        className="flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer 
        transition-colors duration-200 group hover:bg-[#3a3a3a]"
      >
        {/* Icon */}
        <div className="text-gray-400 group-hover:text-gray-200 transition-colors duration-200">
          <LogOut className="w-5 h-5" />
        </div>
        {/* Label */}
        <span className="text-gray-400 text-sm font-medium group-hover:text-gray-200 transition-colors duration-200">
          Logout
        </span>
      </div>
    </div>
  );
};

export default BottomBar;
