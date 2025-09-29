import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js";

// This is a complete, self-contained single-file React application for the BugSnap front page.
// It is designed to be a portfolio-quality project for a solo developer, featuring a professional
// UI, dynamic animations, and a structured layout that is visually engaging and easy to read.
// The code is extensively commented to explain every section, function, and styling choice.

const FirstPage = () => {
  // **ADDED** useNavigate hook so buttons can navigate to /signup
  const navigate = useNavigate();

  const [isAuth, issetISAuth] = useState({
  token: localStorage.getItem("isAuth") || null,
});
  
// --- add this effect (leave useNavigate as-is)
useEffect(() => {
  if(!isAuth.token) return;
//  console.log("isAuth changed:", isAuth);
  if (isAuth.token) {
    navigate("/dashboard");
  }
}, [isAuth, navigate]);

  // State for sticky header, dark mode, and modal
  const [isSticky, setIsSticky] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Initial state is light mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // Refs for scroll-triggered animations and DOM elements
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);
  const typingTextRef = useRef(null);
  const progressBarRef = useRef(null);
  const heroIllustrationRef = useRef(null);

  // Taglines for the typing animation
  const taglines = [
    "Turn chaos into clarity. Fix smarter, ship faster.",
    "The Bug Tracker Developers Actually Want to Use.",
    "From Chaos to Clarity in Bug Management.",
    "Your Bugs, Solved Intuitively.",
    "Track. Fix. Deliver.",
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);

  // useEffect for handling all scroll, animation, and interaction logic
  useEffect(() => {
    // Scroll handling for sticky header and scroll progress bar
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }

      const totalScrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = (scrollY / totalScrollableHeight) * 100;
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${scrollProgress}%`;
      }
    };
    window.addEventListener("scroll", handleScroll);

    // IntersectionObserver for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (aboutRef.current) observer.observe(aboutRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    // Animated counter logic
    const endCount = 500;
    const duration = 2000;
    let startTime = null;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const currentCount = Math.min(
        Math.floor((progress / duration) * endCount),
        endCount
      );
      setUserCount(currentCount);
      if (currentCount < endCount) {
        requestAnimationFrame(animateCount);
      }
    };
    requestAnimationFrame(animateCount);

    // Typing animation for the tagline
    let typingTimeout;
    const typeText = (text, i, cb) => {
      if (typingTextRef.current && i < text.length) {
        typingTextRef.current.innerHTML += text.charAt(i);
        typingTimeout = setTimeout(() => typeText(text, i + 1, cb), 50);
      } else if (cb) {
        setTimeout(cb, 1000);
      }
    };
    const startTypingAnimation = () => {
      if (typingTextRef.current) {
        typingTextRef.current.innerHTML = "";
        typeText(taglines[taglineIndex], 0, () => {
          setTimeout(() => {
            setTaglineIndex((prevIndex) => (prevIndex + 1) % taglines.length);
          }, 2000); // Wait for 2 seconds before changing tagline
        });
      }
    };
    startTypingAnimation();

    // Cleanup listeners
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      clearTimeout(typingTimeout);
    };
  }, [taglineIndex]);

  // Handle mouse movement for hero illustration parallax
  const handleMouseMove = (e) => {
    // Parallax effect for the illustration container
    const heroSection = document.querySelector(".hero-section");
    if (!heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const heroElements = document.querySelector(".hero-illustration-container");
    if (heroElements) {
      heroElements.style.transform = `translate(${(x - 0.5) * 30}px, ${
        (y - 0.5) * 30
      }px)`;
    }
  };

  // =========================
  // Framer Motion variants for the premium letter animation
  // =========================
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.15,
      },
    },
  };
  const letterVariants = {
    hidden: { y: 20, opacity: 0, rotateX: 15, filter: "blur(4px)" },
    show: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
    },
  };

  // ====================================================================================
  // CSS STYLES AND ANIMATIONS
  // ====================================================================================

  const styles = `
    @import url('https://rsms.me/inter/inter.css');
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');

    :root {
      --primary-color: #6366F1;
      --secondary-color: #8B5CF6;
      --text-color-light: #4A5568;
      --bg-light: #F9FAFB;
      --bg-light-secondary: #F3F4F6;
      --card-bg-light: #FFFFFF;
      --shadow-light: rgba(0, 0, 0, 0.05);
      --peach: #FDECE7;
      --peach-accent: #F7B99E;
      --mint: #EAF7EA;
      --mint-accent: #9EE2B6;
    }

    /* Base Theme */
    .light-theme {
      background-color: var(--bg-light);
      color: var(--text-color-light);
    }
    .light-theme .hero-bg-anim {
        background: radial-gradient(ellipse at top, #E0E7FF, var(--bg-light));
    }
    .light-theme .features-section, .light-theme .footer {
        background-color: var(--bg-light-secondary);
    }

    /* Typography */
    .font-playfair { font-family: 'Playfair Display', serif; }
    .text-reveal-in {
      animation: text-fade-in 1.5s ease-in-out forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    .fade-in-on-scroll {
      opacity: 0;
      transform: translateY(50px);
      transition: opacity 1s ease-out, transform 1s ease-out;
    }
    .fade-in-on-scroll.visible {
      opacity: 1;
      transform: translateY(0);
    }
    @keyframes text-fade-in {
      to { opacity: 1; transform: translateY(0); }
    }

    /* Hero Section Background & Elements */
    .hero-bg-anim {
      background-size: 400% 400%;
      animation: gradient-move 15s ease infinite alternate;
    }
    @keyframes gradient-move {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Duplicate / new gradient animation (kept per request) */
    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient-move {
      background-size: 200% 200%;
      animation: gradientMove 15s ease infinite;
    }

    /* Bug & Magnifying Glass Animation */
    @keyframes bug-move {
      0% { transform: translate(-10px, -5px) scale(0.98) rotate(2deg); }
      15% { transform: translate(25px, -15px) scale(1.02) rotate(-5deg); }
      30% { transform: translate(5px, 20px) scale(0.95) rotate(10deg); }
      45% { transform: translate(-20px, 10px) scale(1.05) rotate(-12deg); }
      60% { transform: translate(15px, -5px) scale(1) rotate(5deg); }
      75% { transform: translate(-5px, -25px) scale(0.97) rotate(-8deg); }
      90% { transform: translate(20px, 15px) scale(1.03) rotate(7deg); }
      100% { transform: translate(-10px, -5px) scale(0.98) rotate(2deg); }
    }
    @keyframes glass-tilt {
      0% { transform: rotate(0deg) translate(0, 0); }
      25% { transform: rotate(-1.5deg) translate(2px, -1px); }
      50% { transform: rotate(0deg) translate(-1px, 2px); }
      75% { transform: rotate(1.5deg) translate(1px, -2px); }
      100% { transform: rotate(0deg) translate(0, 0); }
    }
    @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.9; }
    }
    @keyframes light-beam-move {
      0% { transform: translate(0, 0); }
      15% { transform: translate(5px, -10px); }
      30% { transform: translate(-2px, 8px); }
      45% { transform: translate(-8px, 4px); }
      60% { transform: translate(5px, -2px); }
      75% { transform: translate(-2px, -10px); }
      90% { transform: translate(6px, 6px); }
      100% { transform: translate(0, 0); }
    }
    .animate-bug { animation: bug-move 10s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .animate-glass { animation: glass-tilt 10s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .light-beam { animation: pulse 4s ease-in-out infinite, light-beam-move 10s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

    /* Floating elements */
    @keyframes floating-element {
        0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.8; }
        25% { transform: translate(20px, -30px) scale(1.1) rotate(45deg); opacity: 0.9; }
        50% { transform: translate(0, -60px) scale(0.9) rotate(90deg); opacity: 1; }
        75% { transform: translate(-20px, -30px) scale(1.05) rotate(135deg); opacity: 0.9; }
        100% { transform: translate(0, 0) scale(1) rotate(180deg); opacity: 0.8; }
    }
    .float-1 { animation: floating-element 15s ease-in-out infinite; }
    .float-2 { animation: floating-element 18s ease-in-out infinite reverse; }
    .float-3 { animation: floating-element 12s linear infinite; }
    .float-4 { animation: floating-element 20s ease-in-out infinite; }

    /* Float variants requested */
    @keyframes floatFast {
      0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
      50% { transform: translateY(-20px) translateX(10px) rotate(45deg); }
    }
    @keyframes floatSlow {
      0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
      50% { transform: translateY(-10px) translateX(-5px) rotate(90deg); }
    }
    .animate-float-fast { animation: floatFast 6s ease-in-out infinite; }
    .animate-float-slow { animation: floatSlow 10s ease-in-out infinite; }

    /* Buttons & Links */
    .btn-gradient {
        background-image: linear-gradient(to right, var(--primary-color), var(--secondary-color));
        box-shadow: 0 4px 6px rgba(99, 102, 241, 0.5);
    }
    .btn-gradient:hover {
        background-image: linear-gradient(to right, #4f46e5, #7c3aed);
        box-shadow: 0 6px 10px rgba(99, 102, 241, 0.6);
    }
    .btn-ghost {
      border: 2px solid var(--primary-color);
      color: var(--primary-color);
      transition: all 0.3s ease;
    }
    .btn-ghost:hover {
      background-color: var(--primary-color);
      color: var(--card-bg-light);
    }

    /* Card & Section Styles */
    .card-hover-effect {
        transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
    }
    .card-hover-effect:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    .illustration-card {
        background-color: var(--card-bg-light);
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        border: 1px solid #E2E8F0;
    }
    .nav-links a {
      transition: color 0.3s ease;
      position: relative;
    }
    .nav-links a::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -4px;
      width: 0;
      height: 2px;
      background-color: var(--primary-color);
      transition: width 0.3s ease;
    }
    .nav-links a:hover::after {
      width: 100%;
    }

    /* ===============================
      PREMIUM TITLE (PLAIN BLACK)
      =============================== */

    .premium-title {
      display: inline-block;
      position: relative;
      color: #0f172a; /* near-black */
      font-weight: 800;
      line-height: 1.02;
      -webkit-font-smoothing: antialiased;
      will-change: transform;
      perspective: 800px;
      text-shadow: 0 1px 0 rgba(255,255,255,0.02);
    }

    .premium-title .char {
      display: inline-block;
      white-space: pre; /* keep spaces */
      will-change: transform, opacity, filter;
    }

    .premium-title::after {
      content: "";
      position: absolute;
      top: -10%;
      left: -60%;
      width: 40%;
      height: 120%;
      transform: skewX(-20deg);
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
      mix-blend-mode: overlay;
      opacity: 0.09; /* VERY subtle */
      pointer-events: none;
      animation: sheenMove 3.2s ease-in-out infinite;
    }
    @keyframes sheenMove {
      0% { left: -60%; opacity: 0.06; }
      30% { left: 10%; opacity: 0.12; }
      60% { left: 60%; opacity: 0.08; }
      100% { left: 160%; opacity: 0.02; }
    }

    .premium-title-wrap:hover .premium-title {
      transform: translateY(-6px) scale(1.02);
      filter: drop-shadow(0 18px 40px rgba(15,23,42,0.06));
    }

    .title-underline {
      display: inline-block;
      position: relative;
    }
    .title-underline::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -10px;
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02));
      border-radius: 999px;
      transform-origin: left center;
      transition: transform 0.5s cubic-bezier(.2,.9,.3,1);
    }
    .premium-title-wrap:hover .title-underline::after {
      transform: scaleX(1.02);
    }

    @media (max-width: 1024px) {
      .hero-illustration-container { transform: none !important; }
      .title-underline::after { bottom: -8px; height: 5px; }
    }

    /* ================================
      FEATURE PANELS: Updated to use themed tints and simplified layout
      Removed heavy interior illustration — panels now focus on copy and CTA.
      ================================ */
    .feature-panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px; /* increased gap for breathing room */
      align-items: stretch;
    }

    .feature-panel {
      border-radius: 20px;
      padding: 40px 36px;
      min-height: 280px;
      position: relative;
      overflow: visible;
      box-shadow: 0 10px 30px rgba(15,23,42,0.04);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .feature-panel:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 40px rgba(15,23,42,0.08);
    }

    /* Moved to theme-based subtle tints so panels read as part of the same design language */
    .panel-peach {
      background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%);
      border: 1px solid rgba(99,102,241,0.10);
    }
    .panel-mint {
      background: linear-gradient(180deg, rgba(139,92,246,0.06) 0%, rgba(139,92,246,0.02) 100%);
      border: 1px solid rgba(139,92,246,0.09);
    }

    .feature-panel h3 {
      font-size: 2.25rem;
      margin: 0 0 12px 0;
      color: #0f172a;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
      letter-spacing: -0.02em;
    }
    .feature-panel p.lead {
      color: #334155;
      line-height: 1.6; /* slightly tighter than long-form */
      max-width: 720px;
      margin-bottom: 12px;
      font-size: 1.02rem;
    }

    .feature-panel .why {
      font-size: 0.95rem;
      color: #475569;
      margin-top: 8px;
      font-weight: 600;
    }

    @media (max-width: 900px) {
      .feature-panels {
        grid-template-columns: 1fr;
        gap: 28px;
      }
      .feature-panel {
        padding: 24px;
        min-height: auto;
      }
      .feature-panel h3 { font-size: 1.875rem; }
      .feature-panel p.lead { font-size: 1rem; line-height: 1.6; }
    }
  `;

  // Application content
  const appContent = {
    hero: {
      tagline: "Turn chaos into clarity. Fix smarter, ship faster.",
      title: "Stay in Flow. Leave the    Bugs to Us",
      subtitle:
        "BugSnap gives developers a clean, powerful way to track bugs and collaborate without the clutter of traditional tools.",
      ctaPrimary: "Sign Up",
      ctaSecondary: "Watch Our Demo",
      stats: {
        users: 500,
      },
      taglines: [
        "Your Next-Gen Solution Starts Here.",
        "Experience the Future of Productivity.",
        "Design That Speaks, Technology That Works.",
        "Transforming Ideas Into Digital Reality.",
      ],
    },
    about: {
      title: "Why I Built bugSnap",
      text: `As a passionate solo developer, I built BugSnap out of a personal need for a tool that was both powerful and a joy to use. This isn't just a project; it's a solution crafted for builders, by a builder. I spent countless hours turning a simple idea into a platform that addresses the real-world frustrations of bug tracking.`,
    },
    features: [
      {
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
        title: "Automate Your Workflow",
        description:
          "Set business rules to automatically assign bugs, send notifications, and update statuses, so you can spend less time on management and more time on coding.",
      },
      {
        icon: "M14 8h1v8h-1V8zm-2 0h1v8h-1V8zM8 8h1v8H8V8zm-2 0h1v8H6V8zm-2 0h1v8H4V8z",
        title: "Visualize Your Progress",
        description:
          "Get a clear overview of your project's health with our customizable dashboard and powerful reporting tools. See what's open, what's fixed, and what's blocking your team.",
      },
      {
        icon: "M18 8a6 6 0 00-12 0v1h12V8z",
        title: "Secure & Reliable",
        description:
          "Your project data is our top priority. We've implemented robust security features and access controls to ensure your project and user data is always protected.",
      },
      {
        icon: "M10 12l2 2 4-4m4 8a9 9 0 11-18 0 9 9 0 0118 0z",
        title: "Seamless Collaboration",
        description:
          "Keep your team in sync with real-time updates, integrated comments, and discussion forums. Everyone stays on the same page, from dev to QA to project manager.",
      },
    ],
    cta: {
      title: "Ready to Simplify Your Projects?",
      subtitle:
        "Stop tracking bugs manually and start building great software. Join BugSnap today and see the difference.",
      buttonText: "Sign Up",
    },
  };

  // Helper function to render Markdown content securely
  const renderMarkdown = (text) => ({ __html: marked.parse(text) });

  // Component for the "Watch Demo" modal
  const DemoModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full mx-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Watch Our Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Here you can imagine a demo video showcasing the key features of
            BugSnap, like automated workflows, dashboards, and collaborative
            tools.
          </p>
          <div className="relative aspect-w-16 aspect-h-9">
            {/* Placeholder for an embedded video */}
            <div className="bg-gray-200 w-full h-80 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Video Placeholder</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Build animated letters for the title
  const titleText = appContent.hero.title;
  // create array preserving spaces as non-breaking
  const titleChars = titleText
    .split("")
    .map((ch, i) => (ch === " " ? "\u00A0" : ch));

  return (
    // Main container with dynamic class for light/dark mode and a global gradient background
    <div
      className={`min-h-screen font-sans antialiased hero-bg-anim light-theme`}
    >
      <style>{styles}</style>

      {/* Header Component */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isSticky ? "bg-white shadow-sm" : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto flex items-center justify-between p-4 md:p-6 lg:p-8">
          <div className="flex items-center space-x-4">
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
            <span className="text-2xl font-bold text-gray-900 logo-text">
              bugSnap
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 nav-links">
            {/* Navigation links here if needed */}
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="px-5 py-2 text-white font-medium rounded-lg btn-gradient transition-all"
              // **CHANGED**: use React Router navigation to /signup
              onClick={() => navigate("/signup")}
            >
              SIGN UP
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section
          className="relative flex min-h-screen items-center justify-center pt-32 pb-12 overflow-hidden hero-section"
          onMouseMove={handleMouseMove}
        >
          <div className="absolute inset-0 -z-10 bg-gradient-radial from-indigo-100 via-purple-200 to-pink-200 opacity-50 animate-gradient-move rounded-full"></div>

          <div className="container relative z-10 mx-auto px-4 md:px-8 lg:px-12 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 max-w-2xl text-center md:text-left relative">
              <div className="absolute top-0 left-0 w-12 h-12 bg-indigo-300/50 rounded-full animate-float-fast"></div>
              <div className="absolute bottom-0 right-1/4 w-8 h-8 bg-purple-400/50 rounded-full animate-float-slow"></div>

              <p
                className="font-semibold text-indigo-600 mb-2 text-reveal-in"
                style={{ animationDelay: "0.2s" }}
              >
                <span
                  ref={typingTextRef}
                  className="bg-indigo-100/50 rounded-full px-3 py-1 text-sm font-medium"
                ></span>
              </p>

              <div className="premium-title-wrap inline-block">
                <motion.h1
                  className="premium-title title-underline text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight font-playfair text-reveal-in"
                  initial="hidden"
                  animate="show"
                  variants={containerVariants}
                  aria-label={appContent.hero.title}
                  style={{ animationDelay: "0.4s" }}
                >
                  {titleChars.map((char, idx) => (
                    <motion.span
                      className="char"
                      key={`char-${idx}-${char}`}
                      variants={letterVariants}
                      aria-hidden={char === "\u00A0" ? "true" : "false"}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.h1>
              </div>

              <p
                className="mt-4 md:mt-6 text-base md:text-lg text-gray-600 max-w-lg text-reveal-in"
                style={{ animationDelay: "0.6s" }}
              >
                {appContent.hero.subtitle}
              </p>

              <div
                className="mt-8 text-sm text-gray-500 text-reveal-in"
                style={{ animationDelay: "1s" }}
              >
                <p>
                  <span className="font-bold text-gray-800">{userCount}+</span>{" "}
                  developers trust bugSnap!
                </p>
              </div>
            </div>

            {/* Right Graphic with Advanced Animation */}
            <div className="relative flex-1 flex items-center justify-center p-8 w-full max-w-md hero-illustration-container">
              <div className="relative w-80 h-80">
                <div
                  className="absolute w-12 h-12 rounded-lg bg-blue-300/50 float-1"
                  style={{ top: "10%", left: "10%" }}
                ></div>
                <div
                  className="absolute w-8 h-8 rounded-full bg-red-400/50 float-2"
                  style={{ top: "80%", left: "20%" }}
                ></div>
                <div
                  className="absolute w-10 h-10 rounded-full bg-yellow-400/50 float-3"
                  style={{ top: "30%", left: "85%" }}
                ></div>

                <div className="absolute inset-0 z-20 flex items-center justify-center animate-glass">
                  <div className="w-64 h-64 border-4 border-gray-400 rounded-full"></div>
                  <div className="absolute bottom-12 right-12 w-24 h-4 bg-gray-400 rotate-45 rounded-full"></div>
                </div>

                <svg
                  className="light-beam absolute inset-0 z-10 w-full h-full opacity-0"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <radialGradient
                      id="light-gradient"
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: "rgb(255,255,255)",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: "rgb(255,255,255)",
                          stopOpacity: 0,
                        }}
                      />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="50" fill="url(#light-gradient)" />
                </svg>

                <div className="absolute inset-0 z-30 flex items-center justify-center">
                  <div className="relative w-16 h-16 animate-bug">
                    <svg
                      className="w-full h-full fill-current text-red-500"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2c-3.31 0-6 2.69-6 6v3h2v-3c0-2.21 1.79-4 4-4s4 1.79 4 4v3h2v-3c0-3.31-2.69-6-6-6zm-4 9c0 2.21 1.79 4 4 4s4-1.79 4-4H8zm4 7c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4zm-2-8v2h-2v-2h2zm4 0v2h-2v-2h2z" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full"></div>
                  </div>
                </div>

                <div
                  className="absolute -inset-6 -z-20 rounded-full animate-gradient-move"
                  style={{
                    width: "420px",
                    height: "420px",
                    background:
                      "radial-gradient(circle at center, rgba(99,102,241,0.12), rgba(139,92,246,0.06) 40%, rgba(236,72,153,0.03) 80%)",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          ref={aboutRef}
          className="py-12 md:py-20 fade-in-on-scroll"
        >
          <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {appContent.about.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {appContent.about.text}
            </p>
          </div>
        </section>

        {/* Features Section: Updated copy & simplified panels */}
        <section
          id="features"
          ref={featuresRef}
          className="py-12 md:py-20 fade-in-on-scroll"
        >
          <div className="container mx-auto px-4 md:px-8 lg:px-12">
            <div className="feature-panels">
              {/* Left Panel - Collaboration (simplified, no internal illustration) */}
              <div className="feature-panel panel-peach">
                <h3>Centralized Collaboration</h3>
                <p className="lead">
                  Bugs shouldn’t slow teamwork. With bugSnap, every report
                  becomes a shared workspace — where details, discussions, and
                  updates stay connected to the issue itself. No switching
                  tools, no missing context.
                </p>
                <br />
                
                <div className="why">
                  Why bugSnap? We turn bug reports into clear, actionable tasks.
                  Assign owners, track progress, and keep everyone aligned — all
                  in one place, without the clutter of scattered apps.
                </div>
              </div>

              {/* Right Panel - Automation (simplified) */}
              <div className="feature-panel panel-mint">
                <h3>AI That Translates Confusion Into Action</h3>
                <p className="lead">
                  Get clarity fast with AI summaries that turn long bug threads
                  into clear takeaways. Need deeper insight? The AI Debugging
                  Assistant analyzes stack traces, suggests repro steps, and
                  surfaces likely root causes right inside the issue.
                </p>
                <br />
                <div className="why">
                  Why bugSnap? Our AI is built for developers — context-aware,
                  reliable, and seamlessly embedded in your workflow. No extra
                  tabs, just faster fixes and clearer collaboration.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section
          id="cta"
          ref={ctaRef}
          className="py-12 md:py-20 text-center fade-in-on-scroll"
        >
          <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {appContent.cta.title}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {appContent.cta.subtitle}
            </p>
            <button
              // **CHANGED**: navigate to /signup on CTA
              onClick={() => navigate("/signup")}
              className="mt-8 px-8 py-3 text-white font-medium rounded-lg btn-gradient transition-all text-lg shadow-md"
            >
              {appContent.cta.buttonText}
            </button>
          </div>
        </section>

        {/* Demo Modal */}
        {isModalOpen && <DemoModal onClose={() => setIsModalOpen(false)} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 md:px-8 text-center text-gray-500">
          <p>&copy; 2025 bugSnap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default FirstPage;
