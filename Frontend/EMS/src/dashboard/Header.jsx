import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaBell,
  FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function Header({ onToggle }) {
  const navigate = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [greeting, setGreeting] = useState("");

  // ✅ Read from both storages (supports Remember Me)
  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    "user";

  const email =
    localStorage.getItem("email") ||
    sessionStorage.getItem("email") ||
    "No Email";

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  // ✅ SYSTEM TIME GREETING
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    setGreeting(getGreeting());

    // ✅ Auto update greeting (optional but good UX)
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    fetchNotificationStatus();

    window.addEventListener("notificationsUpdated", fetchNotificationStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notificationsUpdated", fetchNotificationStatus);
    };
  }, []);

  const fetchNotificationStatus = async () => {
    try {
      const apiUrl =
        role.toLowerCase() === "admin"
          ? API_ENDPOINTS.notifications.admin
          : API_ENDPOINTS.notifications.user;

      const response = await api.get(apiUrl);

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Header notification fetch error:", error);
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ✅ FIXED LOGOUT (does NOT break Remember Me)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("email");

    navigate("/login");
  };

  const handleNotificationClick = () => {
    if (role.toLowerCase() === "admin") {
      navigate("/notifications");
    } else {
      navigate("/user-notifications");
    }
  };

  return (
    <header className="header">
      {/* LEFT */}
      <div className="header-left" style={{ display: "flex", alignItems: "center" }}>
        <button className="menu-btn" onClick={onToggle}>
          <FaBars />
        </button>

        {/* ✅ Greeting */}
        <h3 style={{ marginLeft: "10px", fontWeight: "600", marginBottom: "5px" }}>
          {greeting} 👋
        </h3>
      </div>

      {/* RIGHT */}
      <div
        className="header-right"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          position: "relative"
        }}
      >
        {/* Notification */}
        <div
          className="notification"
          onClick={handleNotificationClick}
          style={{
            position: "relative",
            cursor: "pointer",
            fontSize: "20px",
            color: "#334155"
          }}
        >
          <FaBell />
          {unreadCount > 0 && <span className="dot"></span>}
        </div>

        {/* Divider */}
        <div
          style={{
            width: "1.5px",
            height: "28px",
            background: "#e5e7eb"
          }}
        />

        {/* Profile */}
        <div onClick={() => setOpenProfile(!openProfile)}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#0aa89e",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {email ? email.charAt(0).toUpperCase() : "U"}
          </div>
        </div>

        {/* Dropdown */}
        {openProfile && (
          <div
            style={{
              position: "absolute",
              top: "55px",
              right: "0",
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
              width: "180px",
              padding: "10px 0",
              zIndex: 1000
            }}
          >
            <div
              style={{
                fontSize: "13px",
                padding: "8px 14px",
                color: "#555",
                borderBottom: "1px solid #eee",
                wordBreak: "break-all",   // 🔥 FIX
                whiteSpace: "normal"
              }}
            >
              {email}
            </div>

            <div
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                cursor: "pointer"
              }}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
