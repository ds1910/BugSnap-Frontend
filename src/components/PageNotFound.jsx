import React, { useState, useEffect } from "react";

/**
 * PageNotFound Component (404)
 *
 * Displays a responsive 404 error page with a button to navigate back to the homepage.
 * It adapts to screen size (desktop, tablet, mobile) using window width tracking.
 */

const PageNotFound = () => {
  // Track window width for responsive design
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Listen for window resize events to update window width dynamically
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Device type detection based on window width
  const isMobile = windowWidth <= 480;
  const isTablet = windowWidth > 480 && windowWidth <= 768;

  /**
   * Returns value based on current device type.
   * @param {string} desktop - Value for desktop view
   * @param {string} tablet - Value for tablet view
   * @param {string} mobile - Value for mobile view
   */
  const getResponsiveValue = (desktop, tablet, mobile) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // =================== Inline Styles =================== //
  const containerStyle = {
    width: "100vw",
    height: "100vh",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "0 20px",
    boxSizing: "border-box",
  };

  const errorCodeStyle = {
    fontSize: getResponsiveValue("120px", "80px", "60px"),
    fontWeight: "bold",
    color: "#d3d3d3",
    margin: 0,
  };

  const titleStyle = {
    fontSize: getResponsiveValue("24px", "20px", "18px"),
    margin: "20px 0",
    color: "#333",
  };

  const messageStyle = {
    fontSize: getResponsiveValue("16px", "14px", "13px"),
    color: "#666",
    marginBottom: "30px",
    maxWidth: "600px",
    padding: "0 10px",
  };

  const buttonStyle = {
    display: "inline-block",
    padding: getResponsiveValue("12px 24px", "10px 20px", "8px 16px"),
    backgroundColor: "#4a90e2",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    marginTop: "20px",
    fontSize: getResponsiveValue("16px", "14px", "13px"),
    transition: "background-color 0.3s ease",
  };

  // =================== Hover Handlers =================== //
  const handleMouseOver = (e) => {
    e.target.style.backgroundColor = "#357ab8"; // Darker shade on hover
  };

  const handleMouseOut = (e) => {
    e.target.style.backgroundColor = "#4a90e2"; // Restore original color
  };

  // =================== Render Component =================== //
  return (
    <div style={containerStyle}>
      <h1 style={errorCodeStyle}>404</h1>
      <h2 style={titleStyle}>Oops! This Page Could Not Be Found</h2>
      <p style={messageStyle}>
        Sorry but the page you are looking for does not exist, has been removed,
        name changed, or is temporarily unavailable.
      </p>
      <a
        href="/" // Redirect to homepage
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        Go To Homepage
      </a>
    </div>
  );
};

export default PageNotFound;
