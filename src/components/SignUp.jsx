// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import StarsBackground from "./StarsBackground";
import GoogleLogin from "./GoogleLogin";
import GitHubLogin from "./GitHubLogin";
import SEO from "./SEO/SEO";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Signup = () => {
  const navigate = useNavigate();

  // state for inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // handler for signup
  const handleSignup = async () => {
    // Input validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    setError("");
    setLoading(true);

    try {
      console.log("Attempting signup with:", { name, email });

      const res = await axios.post(
        `${backendUrl}/user/signup`,
        { name, email, password },
        { withCredentials: true } // include cookies if backend sets them
      );

      if (res.status === 200 || res.status === 201) {
        const data = res.data || {};
        
        // Check if there's a pending invitation to process
        const pendingToken = sessionStorage.getItem('pendingInviteToken');
        const pendingInviter = sessionStorage.getItem('pendingInviter');
        
        if (pendingToken) {
          // Process the pending invitation after successful signup
          try {
            await axios.patch(
              `${backendUrl}/people/add`,
              { token: pendingToken },
              { withCredentials: true }
            );
            
            // Clear the pending invitation
            sessionStorage.removeItem('pendingInviteToken');
            sessionStorage.removeItem('pendingInviter');
            
            // Navigate to dashboard with success message
            if (data.encrypted) {
              navigate(`/dashboard?data=${data.encrypted}&inviteAccepted=true`);
              return;
            } else if (data.userData) {
              localStorage.setItem("isAuth", JSON.stringify(true));
              localStorage.setItem("userInfo", JSON.stringify(data.userData));
              navigate('/dashboard?inviteAccepted=true');
              return;
            }
            
          } catch (inviteErr) {
            console.error("Failed to process pending invitation:", inviteErr);
            // Continue with normal signup flow if invite processing fails
          }
        }
        
        // Normal signup flow
        if (data.encrypted) {
          // If response contains encrypted data, navigate to dashboard with it
          navigate(`/dashboard?data=${data.encrypted}`);
        } else if (data.userData) {
          // If we got direct user data
          localStorage.setItem("isAuth", JSON.stringify(true));
          localStorage.setItem("userInfo", JSON.stringify(data.userData));
          navigate('/dashboard');
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        setError(`Signup failed: ${res.statusText || "Unexpected response"}`);
      }
    } catch (err) {
      // Axios error parsing
      if (err.response?.data) {
        const resp = err.response.data;
        // Handle specific error cases
        if (resp.code === 'EMAIL_EXISTS') {
          setError('This email is already registered. Please sign in instead.');
        } else if (resp.code === 'INVALID_PASSWORD') {
          setError('Password must contain at least one letter, one number, and be at least 6 characters long.');
        } else {
          setError(resp.error || resp.message || 'An error occurred during signup');
        }
      } else if (err.message === 'Network Error') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Sign Up - bugSnap | Create Your Bug Tracking Account"
        description="Join bugSnap and revolutionize your team's bug tracking workflow. Create a free account to start managing issues, collaborating with your team, and shipping better software."
        keywords="sign up, register, bugSnap, bug tracker, create account, team collaboration, free account"
        url="/signup"
        type="website"
      />
      
      <div className="relative min-h-screen flex items-center justify-center bg-black px-4 overflow-hidden">
      {/* Animated background */}
      <StarsBackground />

      {/* Signup Card */}
      <div className="relative w-full max-w-md p-8 rounded-2xl bg-transparent backdrop-blur-sm z-10 transition-all duration-300">
        {/* Branding */}
        <div className="text-center mb-6">
          <h1 className="text-white text-2xl font-semibold">bugSnap</h1>
        </div>

        {/* Heading */}
        <h2 className="text-white text-lg font-medium text-center mb-6">
          Create an account
        </h2>

        {/* OAuth Buttons */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center justify-center gap-2 w-1/2 py-3 rounded-lg
                         bg-black/40 text-white font-medium border border-gray-700
                         hover:ring-2 hover:ring-white transition duration-200">
            <FcGoogle size={20} />
            <GoogleLogin mode="signup" />
          </div>

          <div className="flex items-center justify-center gap-2 w-1/2 py-3 rounded-lg
                         bg-black/40 text-white font-medium border border-gray-700
                         hover:ring-2 hover:ring-white transition duration-200">
            <FaGithub size={20} />
            <GitHubLogin mode="signup" />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-700" />
          <span className="text-gray-500 text-xs px-3">OR</span>
          <div className="flex-grow h-px bg-gray-700" />
        </div>

        {/* Input fields */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg
                       bg-white/10 text-gray-200 placeholder-gray-500
                       border border-gray-700
                       focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                       transition duration-200"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg
                       bg-white/10 text-gray-200 placeholder-gray-500
                       border border-gray-700
                       focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                       transition duration-200"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg
                       bg-white/10 text-gray-200 placeholder-gray-500
                       border border-gray-700
                       focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                       transition duration-200"
          />
        </div>

        {/* Show error */}
        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Sign up button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-lg
                     bg-white text-black font-medium
                     hover:bg-gray-200 transition-colors duration-200
                     disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {/* Bottom links */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Already have an account?{" "}
            <span
              className="text-white cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default Signup;
