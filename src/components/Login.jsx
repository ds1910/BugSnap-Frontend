// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import StarsBackground from "./StarsBackground";
import GoogleLogin from "./GoogleLogin";
import GitHubLogin from "./GitHubLogin";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();

  // state for inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // handler for login
  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", { email, password });

      const res = await axios.post(
        `${backendUrl}/user/login`,
        { email, password },
        { withCredentials: true } // allow cookies to be sent
      );

      if (res.status === 200) {
        const encrypted = res.data?.encrypted;
        if (!encrypted) {
          console.warn("No encrypted payload returned from server.", res.data);
          navigate("/dashboard");
          return;
        }

        // Use react-router navigate to go to /dashboard within the SPA
        navigate(`/dashboard?data=${encodeURIComponent(encrypted)}`);
      } else {
        setError(`Login failed: ${res.statusText || "Unexpected response"}`);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const resp = err.response.data;
        const serverMsg =
          resp.error || resp.message || JSON.stringify(resp) || err.message;
        setError(serverMsg);
      } else {
        setError(err.message || "An unknown error occurred");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black px-4 overflow-hidden">
      <StarsBackground />

      <div
        className="relative w-full max-w-md p-8 rounded-2xl
                   bg-transparent backdrop-blur-sm z-10
                   transition-all duration-300"
      >
        <div className="text-center mb-6">
          <h1 className="text-white text-2xl font-semibold">BugSnap</h1>
        </div>

        <h2 className="text-white text-lg font-medium text-center mb-6">
          Welcome back
        </h2>

        <div className="flex gap-4 mb-6">
          <div
            className="flex items-center justify-center gap-2 w-1/2 py-3 rounded-lg
                       bg-black/40 text-white font-medium border border-gray-700
                       hover:ring-2 hover:ring-white transition duration-200 font-inter"
          >
            <FcGoogle size={20} />
            <GoogleLogin />
          </div>

          <div
            className="flex items-center justify-center gap-2 w-1/2 py-3 rounded-lg
                       bg-black/40 text-white font-medium border border-gray-700
                       hover:ring-2 hover:ring-white transition duration-200 font-inter"
          >
            <FaGithub size={20} />
            <GitHubLogin />
          </div>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-700" />
          <span className="text-gray-500 text-xs px-3">OR</span>
          <div className="flex-grow h-px bg-gray-700" />
        </div>

        <div className="space-y-4">
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

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-lg
                     bg-white text-black font-medium
                     hover:bg-gray-200 transition-colors duration-200
                     disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Don’t have an account?{" "}
            <span
              className="text-white cursor-pointer hover:underline"
              onClick={() => navigate("/signup")}
            >
              Register
            </span>
          </p>
          <p
            className="mt-2 text-white cursor-pointer hover:underline"
            onClick={() => navigate("/forgotpassword")}
          >
            Forgot password?
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
