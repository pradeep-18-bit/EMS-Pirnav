import React, { useEffect } from "react";
import LoginLeft from "./LoginLeft";
import LoginRight from "./LoginRight";
import "./login.css";

export default function Login() {
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.background = "#e6e6e6";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <LoginLeft />
        <LoginRight />
      </div>
    </div>
  );
}
