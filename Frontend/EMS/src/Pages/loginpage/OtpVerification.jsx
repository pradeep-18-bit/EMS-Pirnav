import React, { useEffect } from "react";
import LoginRight from "./LoginRight";
import OtpLeft from "./OtpLeft";
import "./login.css";

export default function OtpVerification() {

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <OtpLeft />
        <LoginRight />
      </div>
    </div>
  );
}
