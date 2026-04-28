import { Navigate } from "react-router-dom";

/* ✅ NORMALIZE */
const normalize = (name) => {
  return (name || "")
    .toLowerCase()
    .replace(/^user\s+/i, "") // remove "User"
    .replace(/\s+/g, " ")
    .trim();
};

/* ✅ UNIVERSAL MODULE MAP */
const moduleMap = {
  dashboard: "dashboard",

  "task management": "task management",
  "user task management": "task management",
  tasks: "task management",

  payroll: "payroll",
  payslip: "payslip",
  "user payslip": "payslip",

  leave: "leave management",
  "leave management": "leave management",
  "user leave management": "leave management",

  attendance: "attendance",
  "user attendance": "attendance",

  notifications: "notifications",
};

/* ✅ MAP FUNCTION */
const mapModule = (name) => {
  return moduleMap[normalize(name)] || normalize(name);
};

/* ✅ GET PERMISSIONS */
const getPermissions = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("permissions")) ||
      JSON.parse(sessionStorage.getItem("permissions")) ||
      []
    );
  } catch {
    return [];
  }
};

const PermissionRoute = ({ children, module }) => {
  const permissions = getPermissions();

  /* ⏳ WAIT */
  if (!Array.isArray(permissions)) {
    return <p style={{ padding: "20px" }}>Loading...</p>;
  }

  /* ✅ ROUTE MODULE */
  const routeModule = mapModule(module);

  /* ✅ CHECK ACCESS */
  const hasAccess = permissions.some((p) => {
    const moduleName =
      typeof p === "string" ? p : p?.moduleName;

    return (
      p?.canAccess === true &&
      mapModule(moduleName) === routeModule
    );
  });

  /* 🔍 DEBUG (keep for now) */
  console.log("Route:", module, "→", routeModule);
  console.log(
    "Permissions:",
    permissions.map((p) => mapModule(p.moduleName))
  );
  console.log("Access:", hasAccess);

  /* ❌ BLOCK */
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  /* ✅ ALLOW */
  return children;
};

export default PermissionRoute;