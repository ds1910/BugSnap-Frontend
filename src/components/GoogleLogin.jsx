import React from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
/**
 * GoogleLogin Component
 * 
 * Renders a button that redirects users to your backend's Google OAuth route.
 * On click, it initiates the Google login flow by redirecting to the backend.
 */

const GoogleLogin = () => {
  
  // ============================
  // Handle Google Login Button
  // ============================


const handleGoogleLogin = () => {
  // Redirect the browser to your backend Google OAuth route
  window.location.href = `${backendUrl}/auth/google`;
};


  // ============================
  // Render Login Button
  // ============================
  return (
    
    <div className="App">
      <button onClick={handleGoogleLogin}>
         Google
      </button>
    </div>
  );
};

export default GoogleLogin;
