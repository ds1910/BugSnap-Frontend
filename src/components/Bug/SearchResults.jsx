import React, { useState, useMemo, useEffect } from "react";
import { useSearchFilter } from "../Bug/SearchFilterContext";
import BugRow from "../Bug/BugRow";
import StatusBadge from "../UI/StatusBadge";
import PriorityBadge from "../UI/PriorityBadge";
import SEO from "../SEO/SEO";
import { Search, Filter, Users, Calendar, Tag, AlertCircle, ChevronDown, ChevronRight, RotateCcw, X } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const SearchResults = ({ activeTeam }) => {
  const { 
    searchQuery, 
    groupBy, 
    order, 
    filters, 
    filterBugs, 
    sortBugs, 
    hasActiveFilters,
    resetAll,
    updateSearchQuery
  } = useSearchFilter();

  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [allBugs, setAllBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bugs from backend
  useEffect(() => {
    const fetchBugs = async () => {
      if (!activeTeam?._id) {
        setAllBugs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 SearchResults: Fetching bugs for team:", activeTeam);
        
        const response = await axios.get(`${backendUrl}/bug/all`, {
          params: { teamId: activeTeam._id },
          withCredentials: true,
        });
        
        console.log("🔍 SearchResults: API response:", response.data);
        
        if (response.data && Array.isArray(response.data)) {
          setAllBugs(response.data);
          console.log("🔍 SearchResults: Set bugs:", response.data.length, "bugs");
        } else if (response.data && response.data.bugs) {
          setAllBugs(response.data.bugs);
          console.log("🔍 SearchResults: Set bugs from .bugs:", response.data.bugs.length, "bugs");
        } else {
          console.log("🔍 SearchResults: No bugs in response, setting empty array");
          setAllBugs([]);
        }
      } catch (error) {
        console.error("Error fetching bugs:", error);
        setAllBugs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, [activeTeam]);

  // Process all bugs through search and filters
  const processedBugs = useMemo(() => {
    console.log("🔍 SearchResults: Processing", allBugs?.length || 0, "bugs");
    console.log("🔍 SearchResults: Search query:", searchQuery);
    console.log("🔍 SearchResults: Has active filters:", hasActiveFilters);
    
    if (!allBugs || allBugs.length === 0) {
      console.log("🔍 SearchResults: No bugs to process");
      return [];
    }
    
    // Apply search and filters
    const filtered = filterBugs(allBugs);
    console.log("🔍 SearchResults: After filtering:", filtered.length, "bugs");
    
    // Sort the results
    const sorted = sortBugs(filtered);
    console.log("🔍 SearchResults: After sorting:", sorted.length, "bugs");
    
    return sorted;
  }, [allBugs, filterBugs, sortBugs]);

  // Group bugs by the selected field
  const groupedBugs = useMemo(() => {
    const groups = {};
    
    processedBugs.forEach(bug => {
      let groupKey;
      
      switch (groupBy) {
        case 'Status':
          groupKey = bug.status || 'No Status';
          break;
        case 'Assignee':
          groupKey = bug.assignedTo?.name || bug.assignedTo || 'Unassigned';
          break;
        case 'Priority':
          groupKey = bug.priority || 'No Priority';
          break;
        case 'Tags':
          groupKey = bug.tags && bug.tags.length > 0 ? bug.tags[0] : 'No Tags';
          break;
        case 'Created by':
          groupKey = bug.createdBy?.name || bug.createdBy || 'Unknown';
          break;
        case 'Due date':
          groupKey = bug.dueDate ? new Date(bug.dueDate).toLocaleDateString() : 'No Due Date';
          break;
        default:
          groupKey = 'All Bugs';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(bug);
    });
    
    return groups;
  }, [processedBugs, groupBy]);

  // Initialize expanded groups
  React.useEffect(() => {
    const groupKeys = Object.keys(groupedBugs);
    if (groupKeys.length <= 3) {
      setExpandedGroups(new Set(groupKeys));
    } else {
      setExpandedGroups(new Set(groupKeys.slice(0, 2)));
    }
  }, [groupedBugs]);

  const toggleGroup = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupIcon = () => {
    switch (groupBy) {
      case 'Status':
        return <AlertCircle size={16} className="text-indigo-400" />;
      case 'Assignee':
        return <Users size={16} className="text-green-400" />;
      case 'Priority':
        return <Tag size={16} className="text-red-400" />;
      case 'Tags':
        return <Tag size={16} className="text-blue-400" />;
      case 'Created by':
        return <Users size={16} className="text-purple-400" />;
      case 'Due date':
        return <Calendar size={16} className="text-yellow-400" />;
      default:
        return <Search size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#292929] text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-[#2C2C2C]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-2xl font-bold text-white">Search Results</h1>
              
              {/* Reset Button */}
              <button
                onClick={() => {
                  resetAll();
                  updateSearchQuery("");
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm font-medium"
                title="Reset all filters and search"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {searchQuery && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-md">
                  <Search size={14} className="text-blue-200" />
                  <span className="text-white font-medium">"{searchQuery}"</span>
                  <button 
                    onClick={() => updateSearchQuery("")}
                    className="ml-1 text-blue-200 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-md">
                  <Filter size={14} className="text-indigo-200" />
                  <span className="text-white font-medium">Filters Active</span>
                </div>
              )}
              {groupBy !== "Assignee" && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-md">
                  <Tag size={14} className="text-purple-200" />
                  <span className="text-white font-medium">Grouped by {groupBy}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full shadow-md">
                <span className="text-emerald-400 font-bold text-lg">{processedBugs.length}</span>
                <span className="text-gray-300 font-medium">results</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex flex-col items-end">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {processedBugs.length}
              </div>
              <div className="text-sm text-gray-400 font-medium">Total Results</div>
              <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mt-1"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Enhanced Loading State
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-28 h-28 bg-gradient-to-br from-[#3A3A3A] to-[#2C2C2C] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-indigo-400 border-r-purple-400"></div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Loading bugs...</h3>
            <p className="text-gray-400 text-center max-w-md leading-relaxed">
              Please wait while we fetch your bug data from the server.
            </p>
            <div className="mt-4 flex gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        ) : processedBugs.length === 0 ? (
          // Enhanced Empty State
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-28 h-28 bg-gradient-to-br from-[#3A3A3A] to-[#2C2C2C] rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Search size={36} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No bugs found</h3>
            <p className="text-gray-400 text-center max-w-lg leading-relaxed">
              {searchQuery 
                ? `No bugs match "${searchQuery}". Try adjusting your search terms or clearing some filters.`
                : 'No bugs match your current filters. Try adjusting your filter criteria or resetting them.'
              }
            </p>
            <button
              onClick={() => {
                resetAll();
                updateSearchQuery("");
              }}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          // Grouped Results
          <div className="p-6 space-y-6">
            {Object.entries(groupedBugs).map(([groupKey, bugs]) => (
              <div key={groupKey} className="bg-gradient-to-br from-[#2C2C2C] to-[#262626] rounded-xl border border-gray-600 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Enhanced Group Header */}
                <div 
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-[#333333] to-[#3A3A3A] cursor-pointer hover:from-[#3A3A3A] hover:to-[#404040] transition-all duration-300 border-b border-gray-600"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gray-700 rounded-lg transition-all duration-200">
                        {expandedGroups.has(groupKey) ? (
                          <ChevronDown size={18} className="text-indigo-400" />
                        ) : (
                          <ChevronRight size={18} className="text-indigo-400" />
                        )}
                      </div>
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        {getGroupIcon(groupKey)}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{groupKey}</h3>
                      <p className="text-sm text-gray-300 font-medium">
                        {bugs.length} {bugs.length === 1 ? 'bug' : 'bugs'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced Group Summary */}
                  <div className="flex items-center gap-4">
                    {groupBy === 'Status' && (
                      <div className="transform transition-all duration-200 hover:scale-105">
                        <StatusBadge status={groupKey} />
                      </div>
                    )}
                    {groupBy === 'Priority' && (
                      <div className="transform transition-all duration-200 hover:scale-105">
                        <PriorityBadge priority={groupKey} />
                      </div>
                    )}
                    <div className="px-3 py-1 bg-gray-700 rounded-full">
                      <span className="text-sm font-semibold text-emerald-400">
                        {bugs.length}
                      </span>
                      <span className="text-sm text-gray-300 ml-1">
                        {bugs.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Group Content */}
                {expandedGroups.has(groupKey) && (
                  <div className="divide-y divide-gray-600 bg-[#242424]">
                    {bugs.map((bug, idx) => {
                      const id = bug?._id ?? bug?.id ?? `search-${idx}`;
                      const formattedDueDate = bug?.dueDate
                        ? new Date(bug.dueDate).toISOString().split("T")[0]
                        : "TBD";

                      // Pass assignedName directly as array for proper multi-user display
                      const assigneeDisplay = Array.isArray(bug.assignedName)
                        ? bug.assignedName
                        : bug.assignedName
                          ? [bug.assignedName]
                          : bug.assignee?.name || bug.assignee?.username || bug.assignedTo?.name || bug.assignedTo?.username
                            ? [{ name: bug.assignee?.name || bug.assignee?.username || bug.assignedTo?.name || bug.assignedTo?.username }]
                            : [];

                      return (
                        <div key={id} className="hover:bg-[#2A2A2A] transition-all duration-200 group border-l-4 border-transparent hover:border-indigo-500">
                          <BugRow
                            key={id}
                            id={id}
                            name={bug.title || bug.name || bug.summary || "Untitled"}
                            assignedName={assigneeDisplay}
                            dueDate={formattedDueDate}
                            priority={bug.priority || "Medium"}
                            status={bug.status || "Open"}
                            comments={bug.comments?.length || bug.commentCount || 0}
                            onDelete={() => {/* Add delete handler if needed */}}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;