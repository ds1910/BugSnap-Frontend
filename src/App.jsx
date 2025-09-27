import React, { useState, useEffect } from "react";
import "./App.css";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./HomeSection";
import TeamSection from "./components/Team/TeamSection";
import PeopleSection from "./components/People/PeopleSection";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function App({ userInfo }) {
  const [allTeams, setAllTeams] = useState(() => {
    const storedTeams = localStorage.getItem("allTeams");
    return storedTeams ? JSON.parse(storedTeams) : [];
  });

  const [selectedSection, setSelectedSection] = useState("home");

  const [activeTeam, setActiveTeam] = useState(() => {
    const storedTeam = localStorage.getItem("activeTeam");
    return storedTeam ? JSON.parse(storedTeam) : null;
  });

  useEffect(() => {
    const getAllTeams = async () => {
      try {
        const response = await fetch(`${backendUrl}/team/allTeam`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        const teamsArray = Array.isArray(data.teams) ? data.teams : [];
        setAllTeams(teamsArray);
        localStorage.setItem("allTeams", JSON.stringify(teamsArray));
      } catch (err) {
        const storedTeams = localStorage.getItem("allTeams");
        setAllTeams(storedTeams ? JSON.parse(storedTeams) : []);
        console.error("Failed to fetch teams:", err);
      }
    };

    getAllTeams();
  }, []);

  const renderMainContent = () => {
    switch (selectedSection) {
      case "home":
        return <Home activeTeam={activeTeam} />;
      case "teams":
        return <TeamSection allTeams={allTeams} />;
      case "people":
        return <PeopleSection />;
      default:
        return <Home activeTeam={activeTeam} />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#292929] text-white overflow-hidden">
      {/* Topbar */}
      <div className="h-[48px] flex-shrink-0 bg-[#292929] border-b border-gray-700">
        <Topbar />
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[270px] flex-shrink-0 overflow-hidden bg-[#292929] border-r border-gray-700">
          <Sidebar
            userInfo={userInfo}
            activeTeam={activeTeam}
            setActiveTeam={setActiveTeam}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-[#292929]">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}
