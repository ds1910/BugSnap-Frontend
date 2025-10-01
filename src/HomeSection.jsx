import React from "react";
import { ActionBar, BugSection } from "./components/Bug";

const Home = ({activeTeam}) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#292929]">
      {/* ActionBar fixed at top */}
      <div className="flex-shrink-0 border-b border-gray-700">
        <ActionBar />
      </div>

      {/* Scrollable bug sections */}
      <div className="flex-1 overflow-y-auto scroll-smooth custom-scroll p-2 space-y-2 text-white">
        <div className="mt-5"><BugSection activeTeam={activeTeam} status="Open" /></div>
        <div className="mt-10"><BugSection activeTeam={activeTeam} status="In Progress" /></div>
        <div className="mt-10"><BugSection activeTeam={activeTeam} status="Resolved" /></div> 
        <div className="mt-10"><BugSection activeTeam={activeTeam} status="Closed" /></div>
      </div>
    </div>
  );
};

export default Home;
