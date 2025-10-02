import React, { useState, useEffect } from "react";
import "./App.css";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./HomeSection";
import TeamSection from "./components/Team/TeamSection";
import PeopleSection from "./components/People/PeopleSection";
import NoTeamState from "./components/Team/NoTeamState";
import NoPeopleState from "./components/People/NoPeopleState";
import SearchResults from "./components/Bug/SearchResults";
import { SearchFilterProvider, useSearchFilter } from "./components/Bug/SearchFilterContext";
import ToastContainer from "./components/UI/ToastContainer";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Component that has access to SearchFilterContext
function AppContent({ userInfo, refreshPeople }) {
  const [allTeams, setAllTeams] = useState(() => {
    const storedTeams = localStorage.getItem("allTeams");
    return storedTeams ? JSON.parse(storedTeams) : [];
  });

  const [selectedSection, setSelectedSection] = useState("home");
  const [peopleRefreshKey, setPeopleRefreshKey] = useState(0);

  const [activeTeam, setActiveTeam] = useState(() => {
    const storedTeam = localStorage.getItem("activeTeam");
    return storedTeam ? JSON.parse(storedTeam) : null;
  });

  // Access search filter context to determine if we should show search results
  const { 
    searchQuery, 
    filters,
    hasActiveFilters, 
    order, 
    groupBy
  } = useSearchFilter();

  // Check if search/filter view is active
  const isSearchViewActive = () => {
    return (
      (searchQuery && searchQuery.trim() !== "") || 
      hasActiveFilters || 
      groupBy !== "Assignee" || 
      order !== "Descending"
    );
  };

  // Check authentication status using cookies only
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking authentication status via cookies...');
        const response = await axios.get(`${backendUrl}/user/me`, {
          withCredentials: true
        });
        
        console.log('User authentication verified via cookies');
        // No need to store tokens in localStorage - cookies handle everything
        
      } catch (error) {
        // User is not authenticated, which is fine for public routes
        console.log('User not authenticated via cookies:', error.response?.status || error.message);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle refresh trigger from Dashboard
  useEffect(() => {
    console.log("=== App.jsx refreshPeople Debug ===");
    console.log("refreshPeople prop changed:", refreshPeople);
    if (refreshPeople) {
      console.log("Incrementing peopleRefreshKey from", peopleRefreshKey, "to", peopleRefreshKey + 1);
      setPeopleRefreshKey(prev => prev + 1);
    }
  }, [refreshPeople]);

  useEffect(() => {
    const getAllTeams = async () => {
      try {
        const response = await axios.get(`${backendUrl}/team/allTeam`, {
          withCredentials: true,
        });
        
        const teamsArray = Array.isArray(response.data.teams) ? response.data.teams : [];
        setAllTeams(teamsArray);
        localStorage.setItem("allTeams", JSON.stringify(teamsArray));
      } catch (err) {
        const storedTeams = localStorage.getItem("allTeams");
        setAllTeams(storedTeams ? JSON.parse(storedTeams) : []);
        console.error("Failed to fetch teams:", err);
      }
    };

    getAllTeams();

    // Listen for navigation events from NoTeamState
    const handleNavigateToTeams = () => {
      setSelectedSection('teams');
    };

    window.addEventListener('navigate-to-teams', handleNavigateToTeams);
    
    return () => {
      window.removeEventListener('navigate-to-teams', handleNavigateToTeams);
    };
  }, []);

  // Watch for changes in teams and activeTeam to auto-navigate
  useEffect(() => {
    // If we currently showing NoTeamState but now have teams and active team, switch to home
    if (!shouldShowNoTeamState() && selectedSection === 'teams') {
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        setSelectedSection('home');
      }, 100);
    }
  }, [allTeams, activeTeam]);

  // Check if we should show NoTeamState (only for home and teams sections)
  const shouldShowNoTeamState = () => {
    const isHomeOrTeamsSection = selectedSection === 'home' || selectedSection === 'teams';
    return isHomeOrTeamsSection && ((!allTeams || allTeams.length === 0) || (!activeTeam || !activeTeam._id));
  };

  const handleCreateTeam = () => {
    setSelectedSection('teams');
  };

  const handleTeamCreated = () => {
    // Refresh teams data
    let userTeams = [];
    let activeTeam = null;
    
    try {
      const storedTeams = localStorage.getItem("userTeams");
      userTeams = storedTeams ? JSON.parse(storedTeams) : [];
    } catch {
      userTeams = [];
    }
    
    try {
      const storedActive = localStorage.getItem("activeTeam");
      activeTeam = storedActive ? JSON.parse(storedActive) : null;
    } catch {
      activeTeam = null;
    }
    
    setAllTeams(userTeams);
    setActiveTeam(activeTeam);
    
    // Navigate to home section to show the team content
    setSelectedSection('home');
  };

  const handleInvitePeople = () => {
    // For people section, we could either:
    // 1. Stay in people section to show invite modal
    // 2. Or navigate to teams first if no teams exist
    if (!allTeams || allTeams.length === 0) {
      setSelectedSection('teams');
    } else {
      setSelectedSection('people');
    }
  };

  const renderMainContent = () => {
    // If search/filter is active, show SearchResults instead of normal content
    if (isSearchViewActive() && selectedSection === "home") {
      return (
        <div className="flex-1 overflow-hidden bg-[#292929]">
          <SearchResults activeTeam={activeTeam} />
        </div>
      );
    }

    // Show NoTeamState if no teams exist or no active team is selected (only for home and teams)
    if (shouldShowNoTeamState()) {
      return (
        <div className="flex-1 overflow-hidden bg-[#292929] p-4">
          <NoTeamState onCreateTeam={handleCreateTeam} onTeamCreated={handleTeamCreated} />
        </div>
      );
    }

    switch (selectedSection) {
      case "home":
        return <Home activeTeam={activeTeam} />;
      case "teams":
        return <TeamSection allTeams={allTeams} />;
      case "people":
        // Show NoPeopleState if no teams exist, otherwise show PeopleSection
        if (!allTeams || allTeams.length === 0) {
          return (
            <div className="flex-1 overflow-hidden bg-[#292929] p-4">
              <NoPeopleState onInvitePeople={handleInvitePeople} />
            </div>
          );
        }
        return <PeopleSection key={peopleRefreshKey} />;
      default:
        return <Home activeTeam={activeTeam} />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#292929] text-white overflow-hidden">
      {/* Topbar */}
      <div className="h-[60px] flex-shrink-0 bg-[#292929]">
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
      
      {/* Toast Container for notifications */}
      <ToastContainer />
    </div>
  );
}

// Main App component wrapper with SearchFilterProvider
export default function App({ userInfo, refreshPeople }) {
  return (
    <SearchFilterProvider>
      <AppContent userInfo={userInfo} refreshPeople={refreshPeople} />
    </SearchFilterProvider>
  );
}