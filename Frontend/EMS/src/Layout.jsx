import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./dashboard/Header";
import api from "./api/axiosInstance";
import { API_ENDPOINTS } from "./api/endpoints";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        const role =
          (localStorage.getItem("role") ||
            sessionStorage.getItem("role") ||
            "").toLowerCase();

        let roleName =
          localStorage.getItem("roleName") ||
          sessionStorage.getItem("roleName");

        console.log("TOKEN 👉", token);
        console.log("ROLE 👉", role);
        console.log("ROLE NAME 👉", roleName);

        // ❌ No token
        if (!token) {
          console.warn("No token found");
          localStorage.setItem("permissions", JSON.stringify([]));
          return;
        }

        // ✅ Skip API for Admin (IMPORTANT FIX)
        if (role === "admin") {
          console.log("Admin → full access, skipping API");

          localStorage.setItem(
            "permissions",
            JSON.stringify([{ moduleName: "ALL" }])
          );

          return;
        }

        // ✅ Skip API for normal user
        if (role === "user") {
          console.log("User → limited access, skipping API");
          localStorage.setItem("permissions", JSON.stringify([]));
          return;
        }

        // ❌ No roleName
        if (!roleName) {
          console.warn("No roleName found");
          localStorage.setItem("permissions", JSON.stringify([]));
          return;
        }

        roleName = roleName.trim();

        const res = await api.get(API_ENDPOINTS.rolePermission.byRoleName(roleName), {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        console.log("✅ API Response:", res.data);

        const data =
          res?.data?.data?.$values ||
          res?.data?.data ||
          res?.data ||
          [];

        if (!Array.isArray(data) || data.length === 0) {
          console.warn("No permissions received");
          localStorage.setItem("permissions", JSON.stringify([]));
          return;
        }

        const uniqueModules = [
          ...new Set(
            data
              .filter((p) => (p.canAccess ?? p.CanAccess) === true)
              .map((p) =>
                (p.moduleName || p.ModuleName || "")
                  .replace("User ", "")
                  .trim()
              )
              .filter(Boolean)
          )
        ];

        const formattedPermissions = uniqueModules.map((name) => ({
          moduleName: name
        }));

        localStorage.setItem(
          "permissions",
          JSON.stringify(formattedPermissions)
        );

        console.log("✅ Permissions saved:", formattedPermissions);

      } catch (err) {
        console.error(
          "❌ API ERROR:",
          err?.response?.data || err.message
        );
        localStorage.setItem("permissions", JSON.stringify([]));
      } finally {
        setReady(true);
      }
    };

    fetchPermissions();
  }, []);

  if (!ready) {
    return <p style={{ padding: "20px" }}>Initializing...</p>;
  }

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? "collapsed" : ""}`}>
        <Header onToggle={() => setCollapsed(!collapsed)} />
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
