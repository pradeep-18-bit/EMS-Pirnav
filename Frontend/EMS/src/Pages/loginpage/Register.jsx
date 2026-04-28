import React, { useEffect, useState } from "react";
import RegisterLeft from "./RegisterLeft";
import LoginRight from "./LoginRight";
import "./login.css";

export default function Register() {

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <RegisterLeft />
        <LoginRight />
      </div>
    </div>
  );
}
