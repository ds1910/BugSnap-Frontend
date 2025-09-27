import React from "react";

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
    // Redirect to backend Google OAuth route
    // console.log("GoogleLogin component rendered");
    // Backend will handle OAuth flow and redirect back to frontend
    window.location.href = "http://localhost:8019/auth/google";
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
