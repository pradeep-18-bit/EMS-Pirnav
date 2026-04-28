import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginLeft() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = localStorage.getItem("rememberPassword");

    if (savedEmail && savedPassword) {
      setForm({
        email: savedEmail,
        password: savedPassword
      });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value
    }));
  };

  const handleRememberMe = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);

    if (!checked) {
      localStorage.removeItem("rememberEmail");
      localStorage.removeItem("rememberPassword");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please enter email and password");
      return;
    }

    setError("");
    setLoading(true);

    const storage = rememberMe ? localStorage : sessionStorage;

    try {
      let res;

      // ✅ FIX: Only admin email uses admin API
      if (form.email === "admin@ems.com") {
        console.log("ADMIN LOGIN");

        res = await api.post(
          API_ENDPOINTS.auth.adminLogin,
          {
            email: form.email,
            password: form.password
          },
          {
            skipAuth: true,
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
      } else {
        console.log("USER LOGIN");

        res = await api.post(
          API_ENDPOINTS.auth.userLogin,
          {
            email: form.email,
            password: form.password
          },
          {
            skipAuth: true,
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
      }

      if (res.status !== 200 || !res.data?.token) {
        throw new Error(
          res.data?.message || `Login failed (${res.status})`
        );
      }

      const token = res.data.token;
      const decoded = parseJwt(token);

      const roleId =
        res.data.roleId ||
        decoded?.RoleId ||
        decoded?.roleId ||
        null;

      const roleName =
        res.data.roleName ||
        decoded?.[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] ||
        "User";

      let role =
        res.data.role ||
        decoded?.role ||
        "user";

      // ✅ FORCE ADMIN ROLE
      if (form.email === "admin@ems.com") {
        role = "admin";
      } else {
        role = (role || "user").trim().toLowerCase();
      }

      console.log("FINAL ROLE 👉", role);

      localStorage.clear();
      sessionStorage.clear();

      storage.setItem("token", token);
      storage.setItem("role", role);
      storage.setItem("roleName", roleName);
      storage.setItem("roleId", roleId);
      storage.setItem("email", form.email);

      let modules = [];

      // ✅ ADMIN → FULL ACCESS (skip API)
      if (role === "admin") {
        modules = [{ moduleName: "all", canAccess: true }];
      } else {
        try {
          const modulesRes = await api.get(API_ENDPOINTS.rolePermission.allowedModules, {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });

          if (Array.isArray(modulesRes.data)) {
            modules = modulesRes.data.map((m) => ({
              moduleId: m.moduleId,
              moduleName: m.moduleName,
              canAccess: true
            }));
          }
        } catch (err) {
          console.error("Modules API Error:", err.message);
        }
      }

      storage.setItem("modules", JSON.stringify(modules));

      if (rememberMe) {
        localStorage.setItem("rememberEmail", form.email);
        localStorage.setItem("rememberPassword", form.password);
      }

      // ✅ REDIRECT BASED ON ROLE
      if (role === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/user-dashboard", { replace: true });
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        const msg = err.response.data?.message || "";

        // 🔥 CUSTOM FRIENDLY MESSAGES
        if (msg.includes("Email does not exist")) {
          setError("No employee found with this email");
        } else if (msg.includes("company")) {
          setError("You are not assigned to any company");
        } else if (err.response.status === 401) {
          setError("Invalid email or password");
        } else {
          setError(msg || "Login failed");
        }

      } else {
        setError("Network error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="left-panel">
      <h1 className="login-title">
        Hello,<br />Welcome Back
      </h1>

      <p className="subtitle">
        Hey, welcome back to your EMS
      </p>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="input-field"
          required
        />

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="input-field"
            required
            style={{ paddingRight: "45px" }}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "15px",
              top: "20%",
              cursor: "pointer"
            }}
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </span>
        </div>

        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMe}
            />
            Remember me
          </label>

          <Link to="/forgot-password" className="forgot-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        Don't have an account?
        <Link
          to="/register"
          style={{
            marginLeft: "6px",
            color: "#6f2dbd",
            textDecoration: "underline"
          }}
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
