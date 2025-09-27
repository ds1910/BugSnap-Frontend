import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PeopleSection from "../People/PeopleSection"
const UserProfileSection = ({ userInfo }) => {
  const [open, setOpen] = useState(false); // State to toggle dropdown visibility
  const navigate = useNavigate(); // React Router navigation hook

  // =================
  // Logout Handler
  // =================
  const handleLogout = () => {
  //  console.log("Logout clicked");
    axios
      .post("http://localhost:8019/api/logout", {}, { withCredentials: true })
      .then(() => {
        // Clear auth info from local storage
        localStorage.removeItem("isAuth");
        localStorage.removeItem("userInfo");

        // Redirect to login page
        navigate("/login", { replace: true });
      })
      .catch((err) => console.error("Logout failed", err));
  };

  return (
    <div className="relative w-[270px]">
      {/* ================= */}
      {/* Profile Bar */}
      {/* ================= */}
      <div
        className="flex items-center justify-between px-3 h-[50px] border-b border-[#707070] cursor-pointer"
        onClick={() => setOpen(!open)} // Toggle dropdown on click
      >
        {/* ================= */}
        {/* Left: Avatar + Name */}
        {/* ================= */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          {userInfo?.image ? (
            <img
              src={userInfo.image}
              alt="User Avatar"
              className="w-8 h-8 rounded-md object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-[#4A90E2] rounded-md flex items-center justify-center text-white font-bold">
              {userInfo?.name?.charAt(0).toUpperCase() || "U"} {/* Initial of the user */}
            </div>
          )}

          {/* User Name */}
          <span className="text-gray-300 font-medium truncate w-[160px]" onClick={<PeopleSection/>}>
            {userInfo?.name || "User Name"} {/* Display user's name or fallback */}
          </span>
        </div>

        {/* ================= */}
        {/* Right: Dropdown Icon */}
        {/* ================= */}
      
      </div>

      {/* ================= */}
      {/* Dropdown List */}
      {/* ================= */}
    
      
    </div>
  );
};

export default UserProfileSection;

/* 
=====================
Comments & Explanation
=====================
1. **Wrapper div**: `relative w-[270px]` ensures dropdown is positioned relative to profile bar.
2. **Profile Bar**:
   - `flex items-center justify-between` aligns avatar/name on the left, dropdown icon on the right.
   - `cursor-pointer` indicates it's clickable.
   - `border-b` separates it visually from the dropdown.
3. **Avatar**:
   - If `userInfo.image` exists → show profile image.
   - Otherwise → fallback: colored box with first letter of name (or "U").
4. **User Name**:
   - `{userInfo?.name || "User Name"}` safely renders actual name or fallback.
   - Truncated with `truncate` to avoid overflow.
5. **Dropdown Icon**:
   - Rotates 180° when dropdown is open using `transition-transform duration-200`.
6. **Dropdown List**:
   - Positioned using `ml-36 mt-4` to appear to the right.
   - `bg-[#3A3A3A] rounded-md shadow-lg` gives card-like styling.
   - `w-max min-w-[120px]` ensures minimum width.
7. **Dropdown Items**:
   - Hover effect: `hover:bg-[#505050]` for interactivity.
   - Border between items for visual separation.
   - `cursor-pointer` for click indication.
8. **State Handling**:
   - `open` state toggles visibility of dropdown on click.
   - Easy to extend with more options in the future.
9. **Logout Handler**:
   - Calls backend `/api/logout`.
   - Clears localStorage auth info.
   - Uses `navigate` to redirect to `/login`.
*/
