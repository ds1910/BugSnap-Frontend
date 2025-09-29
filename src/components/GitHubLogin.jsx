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

const handleGitHubLogin = async () => {
//  console.log("GitHub login initiated");

  try {
      const response = await axios.get(`${backendUrl}auth/github`, {
      withCredentials: true, // needed if backend sets cookies
    });
    console.log("GitHub login response:", response.data);

    if (response.data?.redirectUrl) {
      console.log("Redirecting to:", response.data.redirectUrl);
      window.location.href = response.data.redirectUrl;
    } else {
      console.warn("No redirect URL in response; falling back to direct redirect.");
   //   window.location.href = "http://localhost:8019/auth/github";
    }
  } catch (err) {
    console.error("Error during GitHub login:", err.response?.data || err.message);
  }
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
