import React, { useState, useEffect } from "react";
import LoginRight from "./LoginRight";
import "./login.css";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS, getAuthRoleForEmail } from "../../api/endpoints";

export default function ResetPassword() {

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const otp = location.state?.otp;
  const role = location.state?.role || getAuthRoleForEmail(email);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password) => {
    const passwordRegex = /^[A-Z](?=.*[0-9])(?=.*[!@#$%^&*]).{7,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !otp) {
      setError("Please restart the forgot password flow.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(
        "Password must start with a capital letter and include at least 1 number and 1 special character."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {

      await api.post(
        API_ENDPOINTS.auth.resetPasswordByRole(role),
        {
          email: email,
          otp: parseInt(otp),
          password: formData.password,
          confirmPassword: formData.confirmPassword
        },
        {
          skipAuth: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      navigate("/login");
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors) {
        const firstError = Object.values(data.errors)[0][0];
        setError(firstError);
      } else {
        setError(data?.title || "Unable to connect to server");
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="left-panel">

          <h1 className="login-title">
            Reset<br/>Password
          </h1>

          <p className="subtitle">
            Enter your new password
          </p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleSubmit}>

            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="New Password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />

            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              required
            />

            <button type="submit" className="update-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>

          </form>

        </div>

        <LoginRight />

      </div>
    </div>
  );
}
