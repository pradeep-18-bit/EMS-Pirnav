import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS, getAuthRoleForEmail } from "../../api/endpoints";

export default function ForgotLeft() {

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value.toLowerCase();
    if (value.length <= 50) {
      setEmail(value);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Enter email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Enter valid email");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const role = getAuthRoleForEmail(email);

      await api.post(
        API_ENDPOINTS.auth.forgotPasswordByRole(role),
        { email },
        {
          skipAuth: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess("OTP Sent Successfully");

      setTimeout(() => {
        navigate("/otp", { state: { email, role } });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to connect to server"
      );
    }

    setLoading(false);
  };

  return (
    <form className="left-panel" onSubmit={handleSubmit}>

      <h1 className="login-title">
        Forgot Password
      </h1>

      <p className="subtitle">
        Enter your registered email to receive OTP
      </p>

      {error && <p className="error-text">{error}</p>}

      <input
        type="email"
        id="email"
        name="email"
        autoComplete="email"
        placeholder="Enter your email"
        value={email}
        onChange={handleChange}
        className="input-field"
      />

      <button className="signin-btn" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      {/* ✅ SUCCESS MESSAGE BELOW BUTTON */}
      {success && (
        <p style={{ color: "green", marginTop: "10px" }}>
          {success}
        </p>
      )}

      <p className="signup-text">
        <Link to="/login" className="signup-link">
          Back to Login
        </Link>
      </p>

    </form>
  );
}
