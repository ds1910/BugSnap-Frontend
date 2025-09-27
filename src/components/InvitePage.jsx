import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// ----------------- Toast Component -----------------
const Toast = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[9999]
        transform transition-all duration-300 ease-in-out
        ${visible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"}
        ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white"
            : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400 text-white"
        }
      `}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-3 text-white/70 hover:text-white transition"
      >
        ✕
      </button>
    </div>
  );
};

// ----------------- InvitePage Component -----------------
const InvitePage = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ✅ decode inviter name
  const inviter = searchParams.get("inviter")
    ? decodeURIComponent(searchParams.get("inviter"))
    : "Someone";
  const token = searchParams.get("token");

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      showToast("Invalid invite link. Redirecting...", "error");
      setTimeout(() => navigate("/dashboard"), 1500);
    }
  }, [token, navigate]);

  const handleAcceptInvite = async () => {
    if (!token) return showToast("Invalid invite link", "error");

    try {
      setLoading(true);
      await axios.patch(
        `${backendUrl}/people/add`,
        { token },
        { withCredentials: true }
      );

      showToast("Invite accepted! Redirecting...", "success");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to accept invite", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen py-4 px-2 sm:px-4 md:p-8 invite-page-container relative overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          .font-sans { font-family: 'Roboto', sans-serif; }

          .gradient-button {
            background-image: linear-gradient(to right, #6366f1, #8b5cf6, #d946ef);
            transition: all 0.3s ease-in-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          }
          .gradient-button:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.25);
          }

          .gradient-text {
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            background-image: linear-gradient(to right, #6366f1, #8b5cf6, #d946ef);
          }

          .spinner {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: linear-gradient(90deg, #fff, #d946ef, #8b5cf6);
            background-size: 200% 200%;
            animation: spinGradient 1s linear infinite, gradientShift 1.5s ease-in-out infinite;
          }

          .pulse-text {
            animation: pulse 1s infinite;
          }

          @keyframes spinGradient {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }

          .fade-in { animation: fadeIn 1s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }

          .invite-page-container {
            background-color: #f3f4f6;
            background-image: radial-gradient(at 75% 15%, #d9d0f3 0px, transparent 40%),
                              radial-gradient(at 25% 95%, #e1d3f9 0px, transparent 40%);
            background-size: 100vw 100vh;
            background-repeat: no-repeat;
            background-attachment: fixed;
            position: relative;
          }
        `}
      </style>

      {/* Header */}
      <header className="w-full flex justify-between items-center py-6 px-4 md:px-8">
        <div className="flex items-center space-x-2">
          <svg
            className="w-10 h-10 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.103a2.155 2.155 0 010 3.048l-2.484 2.484a2.155 2.155 0 01-3.048 0L9 12M12 2a10 10 0 100 20 10 10 0 000-20z"
            />
          </svg>
          <span className="text-2xl font-bold text-gray-900 logo-text">BugSnap</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
        >
          Go to Dashboard
        </button>
      </header>

      {/* Main */}
      <main className="text-center p-8 max-w-5xl mx-auto space-y-12 bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg">
        <div className="fade-in">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            You've been invited to join <br />
            <span className="gradient-text">BugSnap.</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 font-medium leading-relaxed">
            <span className="font-semibold text-gray-900">{inviter}</span> has invited you to accelerate bug tracking and collaboration for your team.
          </p>

          {/* Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAcceptInvite}
              disabled={loading}
              className={`gradient-button text-white font-semibold py-4 px-12 rounded-full text-lg transition-all duration-300 ${
                loading ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span className="pulse-text">Accepting...</span>
                </>
              ) : (
                "Accept Your Invitation"
              )}
            </button>
          </div>
        </div>

        {/* About Section */}
        <section className="py-12 px-4 about-section">
          <h2 className="text-3xl sm:text-4xl font-bold">What is BugSnap?</h2>
          <p className="mt-4 text-lg text-gray-800 max-w-3xl mx-auto">
            BugSnap unifies your development team in one platform. Track bugs,
            gather feedback, communicate clearly, and accelerate your product’s
            journey from concept to reality.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        &copy; 2025 BugSnap. All rights reserved.
      </footer>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default InvitePage;
