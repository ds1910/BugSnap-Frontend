import React, { createContext, useContext, useState, useCallback } from "react";

// Create the context
const SearchFilterContext = createContext(null);

// Hook for easy access
export const useSearchFilter = () => {
  const context = useContext(SearchFilterContext);
  if (!context) {
    throw new Error("useSearchFilter must be used within a SearchFilterProvider");
  }
  return context;
};

// Provider component
export const SearchFilterProvider = ({ children }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Group and sort state
  const [groupBy, setGroupBy] = useState("Assignee");
  const [order, setOrder] = useState("Descending");
  
  // Filter state
  const [filters, setFilters] = useState([
    { id: 1, field: "", value: "", condition: "AND" }
  ]);
  
  // Active filters flag
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Update search query
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Update group by
  const updateGroupBy = useCallback((group) => {
    setGroupBy(group);
  }, []);

  // Update order
  const updateOrder = useCallback((orderType) => {
    setOrder(orderType);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    // Check if there are any active filters
    const activeFilters = newFilters.filter(f => f.field && f.value);
    setHasActiveFilters(activeFilters.length > 0);
  }, []);

  // Add new filter
  const addFilter = useCallback(() => {
    const newFilter = { 
      id: Date.now(), 
      field: "", 
      value: "", 
      condition: "AND" 
    };
    const newFilters = [...filters, newFilter];
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Remove filter
  const removeFilter = useCallback((id) => {
    const newFilters = filters.filter(f => f.id !== id);
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const defaultFilter = [{ id: 1, field: "", value: "", condition: "AND" }];
    updateFilters(defaultFilter);
  }, [updateFilters]);

  // Reset all to default
  const resetAll = useCallback(() => {
    setSearchQuery("");
    setGroupBy("Assignee");
    setOrder("Descending");
    clearFilters();
  }, [clearFilters]);

  // Filter bugs based on current state
  const filterBugs = useCallback((bugs) => {
    try {
      let filteredBugs = [...bugs];

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredBugs = filteredBugs.filter(bug => {
          try {
            return (
              bug.title?.toLowerCase().includes(query) ||
              bug.description?.toLowerCase().includes(query) ||
              bug.assignedTo?.name?.toLowerCase().includes(query) ||
              bug.assignee?.name?.toLowerCase().includes(query) ||
              bug.assignee?.username?.toLowerCase().includes(query) ||
              bug.createdBy?.name?.toLowerCase().includes(query) ||
              bug.status?.toLowerCase().includes(query) ||
              bug.priority?.toLowerCase().includes(query) ||
              bug.tags?.some(tag => tag?.toLowerCase().includes(query))
            );
          } catch (e) {
            console.warn("Error filtering bug:", bug, e);
            return false;
          }
        });
      }

      // Apply custom filters
      const activeFilters = filters.filter(f => f.field && f.value);
      if (activeFilters.length > 0) {
        filteredBugs = filteredBugs.filter(bug => {
          try {
            return activeFilters.every(filter => {
              const fieldValue = getFieldValue(bug, filter.field);
              
              // More permissive filtering - don't exclude if field is missing
              if (!fieldValue && filter.field !== "Status" && filter.field !== "Priority") {
                return true;
              }
              
              if (!fieldValue) return false;
              
              switch (filter.field) {
                case "Status":
                  return fieldValue?.toLowerCase() === filter.value.toLowerCase();
                case "Priority":
                  return fieldValue?.toLowerCase() === filter.value.toLowerCase();
                case "Tags":
                  return bug.tags?.some(tag => 
                    tag?.toLowerCase().includes(filter.value.toLowerCase())
                  );
                case "Assignee":
                  return fieldValue?.toLowerCase().includes(filter.value.toLowerCase());
                case "Created by":
                  return fieldValue?.toLowerCase().includes(filter.value.toLowerCase());
                default:
                  return fieldValue?.toLowerCase().includes(filter.value.toLowerCase());
              }
            });
          } catch (e) {
            console.warn("Error applying filters to bug:", bug, e);
            return true; // Include bug if filtering fails
          }
        });
      }

      return filteredBugs;
    } catch (e) {
      console.error("Error in filterBugs:", e);
      return bugs; // Return original bugs if filtering fails
    }
  }, [searchQuery, filters]);

  // Sort bugs based on current state
  const sortBugs = useCallback((bugs) => {
    try {
      const sortedBugs = [...bugs];
      
      sortedBugs.sort((a, b) => {
        try {
          let aValue = getFieldValue(a, groupBy);
          let bValue = getFieldValue(b, groupBy);
          
          // Handle null/undefined values
          if (!aValue) aValue = "";
          if (!bValue) bValue = "";
          
          // Convert to strings for comparison
          aValue = aValue.toString().toLowerCase();
          bValue = bValue.toString().toLowerCase();
          
          if (order === "Ascending") {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        } catch (e) {
          console.warn("Error sorting bugs:", a, b, e);
          return 0;
        }
      });
      
      return sortedBugs;
    } catch (e) {
      console.error("Error in sortBugs:", e);
      return bugs; // Return original bugs if sorting fails
    }
  }, [groupBy, order]);

  // Group bugs based on current state
  const groupBugs = useCallback((bugs) => {
    const grouped = {};
    
    bugs.forEach(bug => {
      const fieldValue = getFieldValue(bug, groupBy);
      const key = fieldValue || "Unassigned";
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bug);
    });
    
    return grouped;
  }, [groupBy]);

  // Process bugs (filter, sort, group)
  const processBugs = useCallback((bugs) => {
    let processedBugs = filterBugs(bugs);
    processedBugs = sortBugs(processedBugs);
    return groupBugs(processedBugs);
  }, [filterBugs, sortBugs, groupBugs]);

  const value = {
    // State
    searchQuery,
    groupBy,
    order,
    filters,
    hasActiveFilters,
    
    // Actions
    updateSearchQuery,
    updateGroupBy,
    updateOrder,
    updateFilters,
    addFilter,
    removeFilter,
    clearFilters,
    resetAll,
    
    // Processing functions
    filterBugs,
    sortBugs,
    groupBugs,
    processBugs
  };

  return (
    <SearchFilterContext.Provider value={value}>
      {children}
    </SearchFilterContext.Provider>
  );
};

// Helper function to get field value from bug object
const getFieldValue = (bug, field) => {
  try {
    switch (field) {
      case "Status":
        return bug.status;
      case "Assignee":
        // Handle multiple assignee field variations and fix username display
        return bug.assignedTo?.name || 
               bug.assignedTo?.username || 
               bug.assignee?.name || 
               bug.assignee?.username ||
               bug.assignedName ||
               bug.assignedTo || 
               bug.assignee;
      case "Priority":
        return bug.priority;
      case "Tags":
        return Array.isArray(bug.tags) ? bug.tags.join(", ") : bug.tags;
      case "Due date":
        return bug.dueDate;
      case "Task type":
        return bug.type || "Bug";
      case "Created by":
        return bug.createdBy?.name || 
               bug.createdBy?.username || 
               bug.createdBy;
      case "Date closed":
        return bug.closedDate;
      case "Date created":
        return bug.createdAt;
      default:
        return "";
    }
  } catch (e) {
    console.warn("Error getting field value:", field, bug, e);
    return "";
  }
};

export default SearchFilterContext;