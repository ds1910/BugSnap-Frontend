import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { decrypt } from "../decrypt";
import App from "../App";

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log(window.location.href);  
    const params = new URLSearchParams(location.search);
    const encryptedData = params.get("data"); 
     console.log("Encrypted data from URL:", encryptedData);
    // Check localStorage for existing user info 
    const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
    const isAuth = JSON.parse(localStorage.getItem("isAuth"));

    if (encryptedData) {
      try {
        const user = decrypt(encryptedData);

        setUserInfo(user);

        localStorage.setItem("userInfo", JSON.stringify(user));
        localStorage.setItem("isAuth", JSON.stringify(true));

        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error("Decryption failed", err);
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
      <App userInfo={userInfo}/>
    </div>
  );
};

export default Dashboard;
