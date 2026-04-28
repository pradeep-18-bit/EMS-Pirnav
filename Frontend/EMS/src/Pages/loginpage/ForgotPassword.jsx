import React, { useEffect } from "react";
import LoginRight from "./LoginRight";
import ForgotLeft from "./ForgotLeft";
import "./login.css";

export default function ForgotPassword() {

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <ForgotLeft />
        <LoginRight />
      </div>
    </div>
  );
}
