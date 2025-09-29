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


const handleGoogleLogin = async () => {
  try {
  //  console.log("Starting Google login...");

    const response = await axios.get(`${backendUrl}/auth/google`, {
      withCredentials: true, // needed if backend sets cookies
    });

    console.log("Google login response:", response.data);

    // If backend sends redirect URL, follow it
    if (response.data?.redirectUrl) {
      window.location.href = response.data.redirectUrl;
    } else {
      console.warn("No redirect URL received from backend.");
    }
  } catch (error) {
    console.error("Google login failed:", error.response?.data || error.message);
  }
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
