import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Register from "./Pages/loginpage/Register";
import Login from "./Pages/loginpage/Login";
import ForgotPassword from "./Pages/loginpage/ForgotPassword";
import OtpVerification from "./Pages/loginpage/OtpVerification";
import ResetPassword from "./Pages/loginpage/ResetPassword";

import Dashboard from "./dashboard/Dashboard";
import UserDashboard from "./dashboard/UserDashboard";

import EmployeeList from "./Employees/EmployeeList";
import AddEmployee from "./Employees/AddEmployee/AddEmployee";
import ScreenPermissions from "./Employees/ScreenPermissions/ScreenPermissions";

import Departments from "./Departments/Departments";
import CompanyDetails from "./Company/CompanyDetails";
import Projects from "./Company/Projects";
// import JobOpenings from "./Company/JobOpenings";
import Holidays from "./Company/Holidays";
import UserHolidays from "./Company/UserHolidays";

import Roles from "./Masters/Roles";
import Assets from "./Masters/Assets";
import Clients from "./Masters/Clients";

import Attendance from "./Attendance/Attendance";
import UserAttendance from "./Attendance/UserAttendance";

import LeaveManagement from "./LeaveManagement/LeaveManagement";
import UserLeaveManagement from "./LeaveManagement/UserLeaveManagement";

import TaskManagement from "./TaskManagement/TaskManagement";
import UserTaskManagement from "./TaskManagement/UserTaskManagement";

import Notifications from "./Notifications/Notifications";
import UserNotifications from "./Notifications/UserNotifications";

import Payroll from "./Payroll/Payroll";
import UserPayslip from "./Payroll/UserPayslip";

import OfferLetters from "./OfferLetters/OfferLetters";
import Reports from "./Reports/Reports";

import Layout from "./Layout";

/* ================= HELPERS ================= */

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const getRole = () =>
  (localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    "user").toLowerCase();

const getModules = () => {
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

const normalize = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/^user\s+/i, "")
    .replace(/^admin\s+/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

/* ================= ROUTES ================= */

const PrivateRoute = ({ children }) => {
  return getToken() ? children : <Navigate to="/login" replace />;
};

/* ================= PERMISSION ================= */

const PermissionRoute = ({ module, children }) => {
  const role = getRole();

  // ADMIN → full access
  if (role === "admin") return children;

  const modules = getModules();

  // NO DEFAULT MODULES
  if (!modules || modules.length === 0) {
    return <Navigate to="/unauthorized" replace />;
  }

  const normalizedModule = normalize(module);

  const allowedModules = modules
    .filter((m) => m.canAccess === true)
    .map((m) => normalize(m.moduleName));

  const hasAccess = allowedModules.includes(normalizedModule);

  return hasAccess
    ? children
    : <Navigate to="/unauthorized" replace />;
};

/* ================= APP ================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp" element={<OtpVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <PermissionRoute module="Dashboard">
                <Dashboard />
              </PermissionRoute>
            }
          />

          {/* USER DASHBOARD */}
          <Route
            path="/user-dashboard"
            element={<UserDashboard />}
          />

          {/* EMPLOYEES */}
          <Route
            path="/employees"
            element={
              <PermissionRoute module="Employees">
                <EmployeeList />
              </PermissionRoute>
            }
          />

          <Route
            path="/employee-permissions/:id/:roleName"
            element={
              <PermissionRoute module="Screen Permissions">
                <ScreenPermissions />
              </PermissionRoute>
            }
          />

          {/* ✅ ADD EMPLOYEE ROUTES */}
          <Route
            path="/add-employee"
            element={
              <PermissionRoute module="Add Employee">
                <AddEmployee />
              </PermissionRoute>
            }
          />

          {/* ✅ VIEW / EDIT EMPLOYEE FULL DETAIL */}
          <Route
            path="/add-employee/:id"
            element={
              <PermissionRoute module="Add Employee">
                <AddEmployee />
              </PermissionRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <PermissionRoute module="Departments">
                <Departments />
              </PermissionRoute>
            }
          />

          {/* COMPANY */}
          <Route
            path="/company"
            element={
              <PermissionRoute module="Company Details">
                <CompanyDetails />
              </PermissionRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <PermissionRoute module="Projects">
                <Projects />
              </PermissionRoute>
            }
          />
{/* 
          <Route
            path="/jobs"
            element={
              <PermissionRoute module="Job Openings">
                <JobOpenings />
              </PermissionRoute>
            }
          /> */}

          <Route
            path="/holidays"
            element={
              <PermissionRoute module="Holidays">
                <Holidays />
              </PermissionRoute>
            }
          />

          <Route
            path="/user-holidays"
            element={
              <PermissionRoute module="User Holidays">
                <UserHolidays />
              </PermissionRoute>
            }
          />

          {/* MASTERS */}
          <Route
            path="/roles"
            element={
              <PermissionRoute module="Roles">
                <Roles />
              </PermissionRoute>
            }
          />

          <Route
            path="/assets"
            element={
              <PermissionRoute module="Assets">
                <Assets />
              </PermissionRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <PermissionRoute module="Clients">
                <Clients />
              </PermissionRoute>
            }
          />

          {/* ATTENDANCE */}
          <Route
            path="/attendance"
            element={
              <PermissionRoute module="Attendance">
                <Attendance />
              </PermissionRoute>
            }
          />

          <Route
            path="/user-attendance"
            element={
              <PermissionRoute module="User Attendance">
                <UserAttendance />
              </PermissionRoute>
            }
          />

          {/* LEAVE */}
          <Route
            path="/leave-management"
            element={
              <PermissionRoute module="Leave Management">
                <LeaveManagement />
              </PermissionRoute>
            }
          />

          <Route
            path="/user-leave-management"
            element={
              <PermissionRoute module="User Leave Management">
                <UserLeaveManagement />
              </PermissionRoute>
            }
          />

          {/* TASKS */}
          <Route
            path="/tasks"
            element={
              <PermissionRoute module="Task Management">
                <TaskManagement />
              </PermissionRoute>
            }
          />

          <Route
            path="/user-tasks"
            element={
              <PermissionRoute module="User Task Management">
                <UserTaskManagement />
              </PermissionRoute>
            }
          />

          {/* PAYROLL */}
          <Route
            path="/payroll"
            element={
              <PermissionRoute module="Payroll">
                <Payroll />
              </PermissionRoute>
            }
          />

          <Route
            path="/user-payslip"
            element={
              <PermissionRoute module="User Payslip">
                <UserPayslip />
              </PermissionRoute>
            }
          />

          {/* OTHER */}
          <Route
            path="/notifications"
            element={
              <PermissionRoute module="Notifications">
                <Notifications />
              </PermissionRoute>
            }
          />

          <Route
            path="/user-notifications"
            element={
              <PermissionRoute module="User Notifications">
                <UserNotifications />
              </PermissionRoute>
            }
          />

          <Route
            path="/offer-letters"
            element={
              <PermissionRoute module="Offer Letters">
                <OfferLetters />
              </PermissionRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <PermissionRoute module="Reports">
                <Reports />
              </PermissionRoute>
            }
          />
        </Route>

        <Route path="/unauthorized" element={<h2>No Access 🚫</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
