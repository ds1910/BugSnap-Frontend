import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { decrypt } from "../decrypt";
import App from "../App";

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [refreshPeople, setRefreshPeople] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // console.log(window.location.href);  
    const params = new URLSearchParams(location.search);
    const encryptedData = params.get("data"); 
    const inviteAccepted = params.get("inviteAccepted");
    
    // If invitation was accepted, trigger people refresh
    if (inviteAccepted === "true") {
      setRefreshPeople(true);
      // Clean up URL to remove the parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
 //    console.log("Encrypted data from URL:", encryptedData);
    // Check localStorage for existing user info 
    let storedUserInfo = null;
    let isAuth = false;
    
    try {
      const storedInfo = localStorage.getItem("userInfo");
      storedUserInfo = storedInfo ? JSON.parse(storedInfo) : null;
    } catch {
      storedUserInfo = null;
    }
    
    try {
      const storedAuth = localStorage.getItem("isAuth");
      isAuth = storedAuth ? JSON.parse(storedAuth) : false;
    } catch {
      isAuth = false;
    }

    if (encryptedData) {
      try {
        const user = decrypt(encryptedData);

        setUserInfo(user);

        localStorage.setItem("userInfo", JSON.stringify(user));
        localStorage.setItem("isAuth", JSON.stringify(true));

        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        // console.error("Decryption failed", err);
        navigate("/login");
      }
    } else if (isAuth && storedUserInfo) {
      setUserInfo(storedUserInfo); 
    } else {
      navigate("/login");
    }
  }, [location, navigate]);


  return (
    <div>
      {/* Pass userInfo + logout handler as props */}
      <App userInfo={userInfo} refreshPeople={refreshPeople}/>
    </div>
  );
};

export default Dashboard;