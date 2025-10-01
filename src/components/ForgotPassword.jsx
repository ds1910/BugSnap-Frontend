// src/pages/ForgotPassword.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StarsBackground from "./StarsBackground";
import axios from "axios";

// Vite env var (fallback to localhost for dev if not set)
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // cooldown in seconds
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef(null);

  // Start cooldown helper
  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
  };

  // Countdown effect
  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // start interval if not already running
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // cleanup when cooldown changes or component unmounts
    return () => {
      if (intervalRef.current && cooldown === 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldown]);

  // ensure interval cleared on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Basic email validation
  const isValidEmail = (value) => {
    // simple RFC-ish check (good for UI validation)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (cooldown > 0) {
      // ignore clicks during cooldown
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) {
      alert("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending password reset request for:", trimmed);
      // POST to backend route that sends the reset email.
      // Axios automatically stringifies data and sets Content-Type.
      const res = await axios.post(`${backendUrl}/user/forgotPassword`, { email: trimmed }, {
        // optional config
        headers: { "Content-Type": "application/json" },
        timeout: 15000, // 15s timeout (optional)
      });

      // Use response from backend. Expecting something like { message: "Reset email sent" }
      if (res.status >= 200 && res.status < 300) {
        alert(res.data?.message || "Reset email sent. Check your inbox (and spam).");
        // prevent immediate re-send
        startCooldown(60);
        // Optionally navigate to another page:
        // navigate("/verify-otp", { state: { email: trimmed } });
      } else {
        // fallback for unexpected statuses
        alert(res.data?.error || "Unexpected response. Please try again.");
      }
    } catch (err) {
      // Axios error handling — provide helpful message
      const serverMessage =
        err.response?.data?.error || err.response?.data?.message || err.message;
      console.error("Forgot password error:", err);
      alert(serverMessage || "Could not send reset email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Format mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black px-4 overflow-hidden">
      {/* Animated background */}
      <StarsBackground />

      {/* Transparent card that blends into the space background */}
      <div
        className="relative w-full max-w-md p-8 rounded-2xl
                   bg-transparent backdrop-blur-sm z-10
                   transition-all duration-300"
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-white text-2xl font-semibold">BugSnap</h1>
        </div>

        <h2 className="text-white text-lg font-medium text-center mb-6">
          Forgot password
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Enter your account email and we'll send you a reset link or code.
        </p>

        {/* Form */}
        <form onSubmit={handleSendEmail} className="space-y-4" noValidate>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="
              w-full px-4 py-3 rounded-lg
              bg-white/10 text-gray-200 placeholder-gray-400
              border border-white/10
              focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30
              transition duration-200
            "
            aria-label="Email address"
            required
          />

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            aria-disabled={loading || cooldown > 0}
            className={`w-full mt-2 py-3 rounded-lg
              ${cooldown > 0 ? "bg-gray-600 text-gray-200" : "bg-white text-black"}
              font-medium
              transition-colors duration-200
              disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? "Sending…" : cooldown > 0 ? `Resend in ${formatTime(cooldown)}` : "Send Email"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              w-full mt-2 py-3 rounded-lg
              bg-transparent text-white font-medium
              border border-white/10
              hover:bg-white/5 transition duration-200
            "
          >
            Back
          </button>
        </form>

        {/* Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            If you don't receive the email within a few minutes, check your spam
            or try again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
