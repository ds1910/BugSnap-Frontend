import React, { useState, useRef, useEffect } from "react";
import { Search, X, Command, Filter, Clock, User, Tag, AlertCircle } from "lucide-react";
import { useSearchFilter } from "../Bug/SearchFilterContext";

const ProfessionalSearchBar = ({ onSearchResults }) => {
  const { 
    searchQuery, 
    updateSearchQuery, 
    hasActiveFilters, 
    resetAll 
  } = useSearchFilter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchInputRef = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('bugSnapSearchHistory') || '[]');
    setSearchHistory(history);
    setRecentSearches(history.slice(0, 5));
  }, []);

  // Save search to history
  const saveToHistory = (query) => {
    if (!query.trim() || searchHistory.includes(query)) return;
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    setRecentSearches(newHistory.slice(0, 5));
    localStorage.setItem('bugSnapSearchHistory', JSON.stringify(newHistory));
  };

  // Search suggestions based on common bug fields
  const suggestions = [
    { type: 'status', icon: <AlertCircle size={14} />, text: 'status:open', description: 'Find open bugs' },
    { type: 'status', icon: <AlertCircle size={14} />, text: 'status:closed', description: 'Find closed bugs' },
    { type: 'priority', icon: <Tag size={14} />, text: 'priority:high', description: 'High priority bugs' },
    { type: 'priority', icon: <Tag size={14} />, text: 'priority:critical', description: 'Critical bugs' },
    { type: 'assignee', icon: <User size={14} />, text: 'assignee:me', description: 'Bugs assigned to me' },
    { type: 'tag', icon: <Tag size={14} />, text: 'tag:frontend', description: 'Frontend related bugs' },
  ];

  const handleInputChange = (e) => {
    const value = e.target.value;
    updateSearchQuery(value);
    setShowSuggestions(value.length > 0);
    
    if (value.length === 0) {
      setIsExpanded(false);
    }
  };

  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      saveToHistory(query.trim());
      setShowSuggestions(false);
      onSearchResults?.(true);
    } else {
      onSearchResults?.(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsExpanded(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    updateSearchQuery(suggestion);
    handleSearch(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    updateSearchQuery('');
    setShowSuggestions(false);
    setIsExpanded(false);
    onSearchResults?.(false);
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full">
      {/* Search Input Container */}
      <div className={`relative transition-all duration-300 ${
        isExpanded || searchQuery ? 'transform scale-105' : ''
      }`}>
        <div className={`relative flex items-center bg-[#3A3A3A] border-2 rounded-xl transition-all duration-300 h-12 ${
          isExpanded || searchQuery 
            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 bg-[#404040]' 
            : 'border-[#505050] hover:border-[#606060] hover:bg-[#404040]'
        }`}>
          {/* Search Icon */}
          <div className="flex items-center pl-4 pr-2">
            <Search 
              size={20} 
              className={`transition-colors duration-300 ${
                isExpanded || searchQuery ? 'text-indigo-400' : 'text-gray-400'
              }`} 
            />
          </div>

          {/* Search Input */}
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsExpanded(true);
              setShowSuggestions(searchQuery.length > 0 || recentSearches.length > 0);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                if (!searchQuery) setIsExpanded(false);
              }, 150);
            }}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none py-3 px-2 text-sm font-medium"
            placeholder="Search bugs or use filters..."
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pr-3">
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1 hover:bg-[#4A4A4A] rounded-lg transition-colors duration-200"
                title="Clear search"
              >
                <X size={16} className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Search Progress Bar */}
        {searchQuery && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 animate-pulse rounded-b-xl" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (isExpanded || searchQuery) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#2C2C2C] border border-[#505050] rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {searchQuery === '' && recentSearches.length > 0 && (
            <div className="p-3 border-b border-[#505050]">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Recent Searches</span>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#3A3A3A] rounded-lg transition-colors duration-200"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Suggestions</span>
              </div>
              <div className="space-y-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#3A3A3A] rounded-lg transition-colors duration-200 group"
                  >
                    <div className="text-indigo-400 group-hover:text-indigo-300">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{suggestion.text}</div>
                      <div className="text-xs text-gray-400">{suggestion.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && filteredSuggestions.length === 0 && recentSearches.length === 0 && (
            <div className="p-6 text-center">
              <Search size={32} className="text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Press Enter to search for "<span className="text-white">{searchQuery}</span>"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalSearchBar;