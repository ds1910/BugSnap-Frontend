import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
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
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/bug-details",
    element: <BugDetail/>
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
    <GoogleOAuthProvider clienatId="YOUR_GOOGLE_CLIENT_ID">
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </StrictMode>
);


