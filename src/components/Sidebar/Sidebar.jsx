import React from "react";
import Navigbar from "./Navigbar";
import Teamspace from "./Teamspace";
import UserProfileSection from "./UserProfileSection";
import BottomBar from "./BottomBar";

const Sidebar = ({
  userInfo,
  activeTeam,
  setActiveTeam,
  selectedSection,
  setSelectedSection,
}) => {
  // normalize to lowercase so the prop is flexible
  const s = (selectedSection || "").toLowerCase();

  // Show Teamspace ONLY when Home is active.
  // Show PeopleSection when People is active.
  // For Teams or any other section, render nothing (empty area).
  const renderSection = () => {
    if (s === "home")
      return (
        <Teamspace activeTeam={activeTeam} setActiveTeam={setActiveTeam} />
      );

    return null;
  };

  return (
    <div className="h-screen w-[270px] bg-[#2C2C2C] text-white flex flex-col">
      {/* Profile */}
      <div className="pb-2">
        <UserProfileSection userInfo={userInfo} />
      </div>

      {/* Navigation */}
      <div className="border-b border-[#707070] pb-5">
        <Navigbar selected={selectedSection} onSelect={setSelectedSection} />
      </div>

      {/* Dynamic middle area */}
      <div className="flex-1 overflow-auto">{renderSection()}</div>

      {/* Bottom bar */}
      <div className="border-t border-[#707070] flex-none sticky bottom-0 bg-[#2C2C2C] z-10">
        <BottomBar />
      </div>
    </div>
  );
};

export default Sidebar;
