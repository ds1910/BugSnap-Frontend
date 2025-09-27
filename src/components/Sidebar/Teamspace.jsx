import React, { useEffect } from "react";
import { UserSquare2, List } from "lucide-react";

const TeamSpace = ({ activeTeam, setActiveTeam }) => {
  const storedTeams = localStorage.getItem("allTeams");
  const teams = storedTeams ? JSON.parse(storedTeams) : [];

  useEffect(() => {
    if (!activeTeam && teams.length > 0) {
      setActiveTeam(teams[0]);
      localStorage.setItem("activeTeam", JSON.stringify(teams[0]));
    }
  }, [activeTeam, teams, setActiveTeam]);

  const handleTeamClick = (team) => {
    const newActive = activeTeam?._id === team._id ? null : team;
    setActiveTeam(newActive);
    // console.log("changes ho gya");
    if (newActive) {
      localStorage.setItem("activeTeam", JSON.stringify(newActive));
    } else {
      localStorage.removeItem("activeTeam");
    }
  };

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="pl-[32px] flex items-center justify-between mb-2 pr-3">
        <div className="flex items-center gap-2 font-semibold text-gray-200">
          <div className="w-[22px] h-[20px] flex items-center justify-center">
            <UserSquare2 className="h-6 w-6 text-blue-500" />
          </div>
          <span>Team Space</span>
        </div>
      </div>

      {/* Team List */}
      <div className="space-y-1">
        {teams.map((team) => (
          <div
            key={team._id}
            onClick={() => handleTeamClick(team)}
            className={`flex items-center justify-between py-1.5 cursor-pointer rounded-lg transition-colors duration-200
              ${
                activeTeam?._id === team._id
                  ? "bg-[#005499]"
                  : "hover:bg-[#3a3a3a]"
              }`}
          >
            <div className="pl-[40px] flex items-center gap-3">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-md transition-colors duration-200
                ${
                  activeTeam?._id === team._id
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-200"
                }`}
              >
                <List className="w-5 h-5" />
              </div>
              <span
                className={`font-medium text-base transition-colors duration-200
                ${
                  activeTeam?._id === team._id
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-200"
                }`}
              >
                {team.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSpace;
