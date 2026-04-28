import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS, getAuthRoleForEmail } from "../../api/endpoints";

export default function OtpLeft() {

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const role = location.state?.role || getAuthRoleForEmail(email);

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length === 0) {
      setError("Enter OTP");
      return;
    }

    if (otp.length < 6) {
      setError("6 digits to be entered");
      return;
    }

    if (!email) {
      setError("Please restart the forgot password flow.");
      navigate("/forgot-password", { replace: true });
      return;
    }

    setError("");
    setLoading(true);

    try {

      await api.post(
        API_ENDPOINTS.auth.verifyOtpByRole(role),
        {
          email,
          otp,
        },
        {
          skipAuth: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      navigate("/reset-password", { state: { email, otp, role } });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to connect to server");
    }

    setLoading(false);
  };

  return (
    <div className="left-panel">

      <h1 className="login-title">
        OTP Verification
      </h1>

      <p className="subtitle">
        Enter the OTP sent to your email
      </p>

      {error && <p className="error-text">{error}</p>}

      <input
        type="text"
        id="otp"
        name="otp"
        autoComplete="one-time-code"
        placeholder="Enter OTP"
        value={otp}
        onChange={handleChange}
        maxLength={6}
        className="input-field"
      />

      <button
        className="signin-btn"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

    </div>
  );
}
