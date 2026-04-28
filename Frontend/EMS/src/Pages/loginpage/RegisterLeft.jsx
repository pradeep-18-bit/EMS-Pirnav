import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterLeft() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ loading state

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "firstName" || name === "lastName") {
      if (/^[a-zA-Z\s]{0,30}$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }

    if (name === "email") {
      setFormData({ ...formData, [name]: value.toLowerCase() });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const validatePassword = (password) => {
    const passwordRegex = /^[A-Z](?=.*[0-9])(?=.*[!@#$%^&*]).{7,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePassword(formData.password)) {
      setError("Password must start with capital letter & include number and special character");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {

      setLoading(true); // ✅ start loading

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      const response = await api.post(
        API_ENDPOINTS.auth.userRegister,
        payload,
        {
          skipAuth: true,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      console.log("REGISTER SUCCESS:", response.data);
      navigate("/login");

    }
    catch (err) {
      console.log("REGISTER ERROR:", err.response?.data);
      setError(err.response?.data?.message || "Registration Failed");
    }
    finally {
      setLoading(false); // ✅ stop loading
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 45px 14px 14px",
    marginBottom: "15px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none"
  };

  const passwordWrapper = {
    position: "relative",
    width: "100%"
  };

  const eyeStyle = {
    position: "absolute",
    right: "15px",
    top: "40%",
    transform: "translateY(-40%)",
    cursor: "pointer",
    color: "#666",
    fontSize: "18px"
  };

  return (
    <form className="left-panel" onSubmit={handleSubmit}>

      <h1 className="login-title">Register</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        name="firstName"
        placeholder="First Name"
        style={inputStyle}
        value={formData.firstName}
        onChange={handleChange}
      />

      <input
        type="text"
        name="lastName"
        placeholder="Last Name"
        style={inputStyle}
        value={formData.lastName}
        onChange={handleChange}
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        style={inputStyle}
        value={formData.email}
        onChange={handleChange}
      />

      {/* Password */}
      <div style={passwordWrapper}>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          style={inputStyle}
          value={formData.password}
          onChange={handleChange}
        />
        <span style={eyeStyle} onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEye /> : <FaEyeSlash />}
        </span>
      </div>

      {/* Confirm Password */}
      <div style={passwordWrapper}>
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder="Confirm Password"
          style={inputStyle}
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <span style={eyeStyle} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
          {showPassword ? <FaEye /> : <FaEyeSlash />}
        </span>
      </div>

      <button
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "25px",
          border: "none",
          background: loading ? "#8fd8b9" : "#17b978",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "bold",
          marginTop: "10px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>

      <p
        style={{
          marginTop: "15px",
          textAlign: "center"
        }}
      >
        Already have an account?
        <Link
          to="/login"
          style={{
            marginLeft: "5px",
            color: "#6f2dbd",
            textDecoration: "underline",
            fontWeight: "500"
          }}
        >
          Sign In
        </Link>
      </p>

    </form>
  );
}
