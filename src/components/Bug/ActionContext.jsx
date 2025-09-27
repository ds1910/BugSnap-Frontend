// // ActionContext.jsx
// import React, { createContext, useContext, useState } from "react";

// const ActionContext = createContext(null);

// // Hook for easy access
// export const useActionContext = () => useContext(ActionContext);

// export const ActionProvider = ({ children }) => {
//   const [groupBy, setGroupBy] = useState("Assignee");
//   const [order, setOrder] = useState("Descending");
//   const [filters, setFilters] = useState({}); // FilterPanel will update this

//   return (
//     <ActionContext.Provider
//       value={{ groupBy, setGroupBy, order, setOrder, filters, setFilters }}
//     >
//       {children}
//     </ActionContext.Provider>
//   );
// };
