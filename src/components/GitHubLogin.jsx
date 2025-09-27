import React from 'react';

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
    // Redirect to backend GitHub OAuth route
    // Backend will handle the OAuth flow and redirect back to frontend
     console.log("GitHubLogin component rendered 2");
    window.location.href = "http://localhost:8019/auth/github";
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
