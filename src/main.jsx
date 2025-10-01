import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";

// Suppress ReactQuill findDOMNode warning and React Router future flag warning in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args[0]?.toString?.() || args[0] || '';
    if (message.includes('findDOMNode is deprecated') || 
        message.includes('React Router Future Flag Warning') ||
        message.includes('React Router will begin wrapping state updates') ||
        message.includes('Download the React DevTools')) {
      return; // Suppress these specific warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args[0]?.toString?.() || args[0] || '';
    if (message.includes('findDOMNode is deprecated')) {
      return; // Suppress this specific error too
    }
    originalError.apply(console, args);
  };
}

// Import pages
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PageNotFound from "./components/PageNotFound.jsx";
import App from "./App.jsx";
import Signup from "./components/SignUp.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import BugDetail from "./components/Bug_Info_Page/BugDetail.jsx";     
import FirstPage from "./components/FirstPage.jsx";
import InvitePage  from "./components/InvitePage.jsx"
import ResetPasswordConfirm from "./components/ResetPasswordConfirm.jsx";  
import LoadingScreenDemo from "./components/LoadingScreenDemo.jsx";  

// Wrapper component for BugDetail route
const BugDetailRoute = () => {
  const navigate = useNavigate();
  return <BugDetail onClose={() => navigate('/dashboard')} />;
};  

// PrivateRoute wrapper
// const PrivateRoute = ({ element }) => {
//   const isAuthenticated = JSON.parse(localStorage.getItem("isAuth"));
//   return isAuthenticated ? element : <Navigate to="/login" />;
// };

// Router config (no App wrapper)
const router = createBrowserRouter([
  {
    path: "/main",
    element: <App/>,
  },
  {
    path: "/accept-invite",
    element: <InvitePage/>
  },
  {
    path: "/loading-demo",
    element: <LoadingScreenDemo/>
  },
  {
    path: "/login",
    element: <Login />,
  },
   {
    path: "/signup",
    element: <Signup />,
  },
   {
    path: "/forgotpassword",
    element: <ForgotPassword />,
  },
    {
    path: "/resetpassword",
    element: <ResetPasswordConfirm />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/bug-details",
    element: <BugDetailRoute/>
  },
  {
    path: "/",
    element: <FirstPage/>
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);


// Render
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <GoogleOAuthProvider clienatId="YOUR_GOOGLE_CLIENT_ID">
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </HelmetProvider>
  </StrictMode>
);


