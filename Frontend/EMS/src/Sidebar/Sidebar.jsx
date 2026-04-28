import React, { useState } from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaList,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
  FaCalendarAlt,
  FaBriefcase,
  FaShieldAlt,
  FaLaptop,
  FaCalendarMinus,
  FaBell,
  FaFileSignature,
  FaChartBar,
  FaMoneyBillWave,
  FaUserTie
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

/* ================= HELPERS ================= */

const normalize = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
const getPermissions = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("modules")) ||
      JSON.parse(sessionStorage.getItem("modules")) ||
      []
    );
  } catch {
    return [];
  }
};

/* ✅ FIX: use "role" instead of "roleName" */
const getRoleName = () =>
  (localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    "").toLowerCase();

/* ================= PERMISSION LOGIC ================= */

const hasPermission = (module) => {
  const role = getRoleName();
  const permissions = getPermissions();
  const normalizedModule = normalize(module);

  // ✅ ADMIN → show ALL screens
  if (role && role.trim().toLowerCase() === "admin") return true;

  // ❌ no permissions
  if (!permissions || permissions.length === 0) return false;

  const allowedModules = permissions.map((p) =>
    normalize(p.moduleName)
  );

  return (
    allowedModules.includes(normalizedModule) ||
    allowedModules.includes("all") // 🔥 important
  );
};

/* ================= COMPONENT ================= */

function Sidebar({ collapsed }) {
  const [openEmployees, setOpenEmployees] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);
  const [openMasters, setOpenMasters] = useState(false);

  const navigate = useNavigate();
  const roleName = getRoleName();

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="logo">
        <span className="logo-icon">🏢</span>
        {!collapsed && <span className="logo-text">EMS</span>}
      </div>

      <nav className="menu">

        {/* DASHBOARD */}
        <NavLink
          to={roleName === "admin" ? "/dashboard" : "/user-dashboard"}
          className="menu-item"
        >
          <FaTachometerAlt />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* EMPLOYEES */}
        {(hasPermission("Employees") || hasPermission("Add Employee")) && (
          <>
            <div className="menu-item" onClick={() => setOpenEmployees(!openEmployees)}>
              <FaUsers />
              {!collapsed && (
                <>
                  <span>Employees</span>
                  <span style={{ marginLeft: "auto" }}>
                    {openEmployees ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </>
              )}
            </div>

            {!collapsed && openEmployees && (
              <div className="submenu">
                {hasPermission("Employees") && (
                  <NavLink to="/employees" className="submenu-item">
                    <FaList />
                    <span>Employee List</span>
                  </NavLink>
                )}

                {hasPermission("Add Employee") && (
                  <NavLink to="/add-employee" className="submenu-item">
                    <FaUsers />
                    <span>Add Details</span>
                  </NavLink>
                )}
              </div>
            )}
          </>
        )}

        {hasPermission("User Holidays") && (
          <NavLink to="/user-holidays" className="menu-item">
            <FaCalendarAlt />
            {!collapsed && <span>My Holidays</span>}
          </NavLink>
        )}

        {/* COMPANY */}
        {(hasPermission("Company Details") || hasPermission("Projects")) && (
          <>
            <div className="menu-item" onClick={() => setOpenCompany(!openCompany)}>
              <FaBuilding />
              {!collapsed && (
                <>
                  <span>Company</span>
                  <span style={{ marginLeft: "auto" }}>
                    {openCompany ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </>
              )}
            </div>

            {!collapsed && openCompany && (
              <div className="submenu">
                {hasPermission("Company Details") && (
                  <NavLink to="/company" className="submenu-item">
                    <FaBuilding />
                    <span>Company Details</span>
                  </NavLink>
                )}

                {hasPermission("Projects") && (
                  <NavLink to="/projects" className="submenu-item">
                    <FaList />
                    <span>Projects</span>
                  </NavLink>
                )}

                {hasPermission("Holidays") && (
                  <NavLink to="/holidays" className="submenu-item">
                    <FaCalendarAlt />
                    {!collapsed && <span>Holidays</span>}
                  </NavLink>
                )}

                {/* {hasPermission("Job Openings") && (
                  <NavLink to="/jobs" className="submenu-item">
                    <FaBriefcase />
                    <span>Job Openings</span>
                  </NavLink>
                )} */}

              </div>
            )}
          </>
        )}

        {/* MASTERS */}
        {(hasPermission("Roles") ||
          hasPermission("Assets") ||
          hasPermission("Clients") ||
          hasPermission("Departments")) && (
            <>
              <div
                className="menu-item"
                onClick={() => setOpenMasters(!openMasters)}
              >
                <FaShieldAlt />
                {!collapsed && (
                  <>
                    <span>Masters</span>
                    <span style={{ marginLeft: "auto" }}>
                      {openMasters ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </>
                )}
              </div>

              {!collapsed && openMasters && (
                <div className="submenu">
                  {hasPermission("Roles") && (
                    <NavLink to="/roles" className="submenu-item">
                      <FaShieldAlt />
                      <span>Roles</span>
                    </NavLink>
                  )}

                  {hasPermission("Assets") && (
                    <NavLink to="/assets" className="submenu-item">
                      <FaLaptop />
                      <span>Assets</span>
                    </NavLink>
                  )}

                  {hasPermission("Clients") && (
                    <NavLink to="/clients" className="submenu-item">
                      <FaUserTie />
                      <span>Clients</span>
                    </NavLink>
                  )}

                  {hasPermission("Departments") && (
                    <NavLink to="/departments" className="submenu-item">
                      <FaBuilding />
                      <span>Departments</span>
                    </NavLink>
                  )}
                </div>
              )}
            </>
          )}

        {/* PAYROLL */}
        {hasPermission("Payroll") && (
          <NavLink to="/payroll" className="menu-item">
            <FaMoneyBillWave />
            {!collapsed && <span>Payroll</span>}
          </NavLink>
        )}

        {/* USER PAYSLIP */}
        {hasPermission("User Payslip") && (
          <NavLink to="/user-payslip" className="menu-item">
            <FaMoneyBillWave />
            {!collapsed && <span>Payslip</span>}
          </NavLink>
        )}

        {/* OTHER */}
        {hasPermission("Reports") && (
          <NavLink to="/reports" className="menu-item">
            <FaChartBar />
            {!collapsed && <span>Reports</span>}
          </NavLink>
        )}

        {hasPermission("Offer Letters") && (
          <NavLink to="/offer-letters" className="menu-item">
            <FaFileSignature />
            {!collapsed && <span>Offer Letters</span>}
          </NavLink>
        )}

        {hasPermission("Attendance") && (
          <NavLink to="/attendance" className="menu-item">
            <FaCalendarAlt />
            {!collapsed && <span>Attendance</span>}
          </NavLink>
        )}

        {hasPermission("User Attendance") && (
          <NavLink to="/user-attendance" className="menu-item">
            <FaCalendarAlt />
            {!collapsed && <span>My Attendance</span>}
          </NavLink>
        )}

        {hasPermission("Leave Management") && (
          <NavLink to="/leave-management" className="menu-item">
            <FaCalendarMinus />
            {!collapsed && <span>Leave</span>}
          </NavLink>
        )}

        {hasPermission("User Leave Management") && (
          <NavLink to="/user-leave-management" className="menu-item">
            <FaCalendarMinus />
            {!collapsed && <span>Employee Leave</span>}
          </NavLink>
        )}

        {hasPermission("Task Management") && (
          <NavLink to="/tasks" className="menu-item">
            <FaList />
            {!collapsed && <span>Tasks</span>}
          </NavLink>
        )}

        {hasPermission("User Task Management") && (
          <NavLink to="/user-tasks" className="menu-item">
            <FaList />
            {!collapsed && <span>My Tasks</span>}
          </NavLink>
        )}

        {hasPermission("Notifications") && (
          <NavLink to="/notifications" className="menu-item">
            <FaBell />
            {!collapsed && <span>Notifications</span>}
          </NavLink>
        )}

        {hasPermission("User Notifications") && (
          <NavLink to="/user-notifications" className="menu-item">
            <FaBell />
            {!collapsed && <span>My Notifications</span>}
          </NavLink>
        )}

      </nav>
    </div>
  );
}

export default Sidebar;

