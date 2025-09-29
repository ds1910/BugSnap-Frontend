import React from 'react';
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

/**
 * GitHubLogin Component
 * 
 * This component renders a button that redirects users to your backend's GitHub OAuth route.
 * On click, it initiates the GitHub login flow by redirecting to the backend.
 */

const GitHubLogin = () => {

  // ============================
  // Handle GitHub Login Button
  // ============================

const handleGitHubLogin = () => {
  window.location.href = `${backendUrl}/auth/github`;
};


  // ============================
  // Render Login Button
  // ============================
  return (
    // console.log("GitHubLogin component rendered"),
    <div className="App" >
      <button onClick={handleGitHubLogin}>
         Github
      </button>
    </div>
  );
};

export default GitHubLogin;
