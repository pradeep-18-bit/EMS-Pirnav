import { BASE_URL, SERVER_URL } from "./config";

const normalizePath = (path) => String(path).replace(/^\/+/, "");
const ADMIN_EMAIL = "admin@ems.com";

export const API = {
  // ================= AUTH =================
  AUTH: {
    ADMIN_LOGIN: "/Admin/login",
    USER_LOGIN: "/user/login",
    REGISTER: "/user/register",
    ADMIN: {
      FORGOT_PASSWORD: "/Admin/forgot-password",
      VERIFY_OTP: "/Admin/verify-otp",
      RESET_PASSWORD: "/Admin/reset-password",
    },
    USER: {
      FORGOT_PASSWORD: "/User/forgot-password",
      VERIFY_OTP: "/User/verify-otp",
      RESET_PASSWORD: "/User/reset-password",
    },
  },

  // ================= DASHBOARD =================
  DASHBOARD: {
    ADMIN: "/dashboard",
    USER: "/user-dashboard",
  },

  // ================= ATTENDANCE =================
  ATTENDANCE: {
    CHECKIN: "/Attendance/check-in",
    CHECKOUT: "/Attendance/check-out",
    WEEKLY: "/Attendance/weekly",
    PREVIOUS_WEEK: "/Attendance/previous-week",
    CURRENT_MONTH: "/Attendance/current-month",
    PREVIOUS_MONTH: "/Attendance/previous-month",
    MONTH: "/Attendance/month",
    MONTHLY: "/Attendance/monthly",
    TODAY: "/Attendance/today",
    UPDATE: "/Attendance/admin/update-attendance",
    STATS_TODAY: "/Attendance/stats/today",
    STATS_YEAR: "/Attendance/stats/year",
    RUN_ABSENT: "/Attendance/run/absent-check",
    RUN_MISSING: "/Attendance/run/missing-checkout",
  },

  // ================= ADMIN NOTIFICATIONS =================
  ADMIN_NOTIFICATION: {
    LIST: "/admin-notifications",
    COUNT: "/admin-notifications/count",
    READ: (id) => `/admin-notifications/read/${id}`,
    READ_ALL: "/admin-notifications/read-all",
  },

  // ================= USER NOTIFICATIONS =================
  USER_NOTIFICATION: {
    LIST: "/user-notifications",
    READ: (id) => `/user-notifications/${id}/read`,
    MARK_ALL: "/user-notifications/mark-all",
  },

  // ================= ASSETS =================
  ASSETS: {
    LIST: "/Assets",
    CREATE: "/Assets",
    GET_BY_ID: (id) => `/Assets/${id}`,
    UPDATE: (id) => `/Assets/${id}`,
    DELETE: (id) => `/Assets/${id}`,
  },

  // ================= BRANCHES =================
  BRANCHES: {
    LIST: "/Branches",
    CREATE: "/Branches",
    UPDATE: (id) => `/Branches/${id}`,
    DELETE: (id) => `/Branches/${id}`,
  },

  // ================= CLIENTS =================
  CLIENTS: {
    LIST: "/Clients",
    CREATE: "/Clients",
    GET_BY_NAME: (name) => `/Clients/by-name/${name}`,
    PROJECTS: (id) => `/Clients/${id}/projects`,
    UPDATE: (name) => `/Clients/${name}`,
    DELETE: (name) => `/Clients/${name}`,
  },

  // ================= DEPARTMENTS =================
  DEPARTMENTS: {
    LIST: "/Departments",
    CREATE: "/Departments",
    GET_BY_ID: (id) => `/Departments/${id}`,
    UPDATE: (id) => `/Departments/${id}`,
    DELETE: (id) => `/Departments/${id}`,
  },

  // ================= EMPLOYEES =================
  EMPLOYEES: {
    LIST: "/Employees",
    CREATE: "/Employees",
    UPDATE: (id) => `/Employees/${id}`,
    DELETE: (id) => `/Employees/${id}`,
  },

  // ================= EMPLOYEE FULL DETAILS =================
  EMPLOYEE_FULL: {
    MY_DETAILS: "/EmployeeFullDetail/my-details",
    UPDATE_MY: "/EmployeeFullDetail/my-details",
    GET_BY_ID: (id) => `/EmployeeFullDetail/${id}`,
  },

  // ================= EMPLOYEE PERSONAL =================
  EMPLOYEE_PERSONAL: {
    // Kept lowercase to match the current working backend path used by the app.
    CREATE: "/employeepersonalinfo",
    LIST: "/employeepersonalinfo",
    GET_BY_ID: (id) => `/employeepersonalinfo/${id}`,
    UPDATE: (id) => `/employeepersonalinfo/${id}`,
    DELETE: (id) => `/employeepersonalinfo/${id}`,
  },

  // ================= BANK DETAILS =================
  BANK: {
    CREATE: "/EmployeeBankDetails",
    LIST: "/EmployeeBankDetails",
    UPDATE: (id) => `/EmployeeBankDetails/${id}`,
    DELETE: (id) => `/EmployeeBankDetails/${id}`,
  },

  // ================= EDUCATION =================
  EDUCATION: {
    CREATE: "/EmployeeEducation",
    GET_BY_ID: (id) => `/EmployeeEducation/${id}`,
    UPDATE: (id) => `/EmployeeEducation/${id}`,
    DELETE: (id) => `/EmployeeEducation/${id}`,
  },

  // ================= EXPERIENCE =================
  EXPERIENCE: {
    CREATE: "/EmployeeExperience",
    UPDATE: (id) => `/EmployeeExperience/${id}`,
    DELETE: (id) => `/EmployeeExperience/${id}`,
  },

  // ================= LEAVE =================
  LEAVE: {
    CREATE: "/EmployeeLeave",
    LIST: "/EmployeeLeave",
    ALL: "/EmployeeLeave/all",
    APPROVE: (id) => `/EmployeeLeave/approve-reject/${id}`,
    BALANCE: "/EmployeeLeave/balance",
    UPDATE_STATUS: (id) => `/EmployeeLeave/update-status/${id}`,
    DELETE: (id) => `/EmployeeLeave/${id}`,
    CANCEL: (id) => `/EmployeeLeave/cancel/${id}`,
    APPLY: "/EmployeeLeave/apply",
    MY_LEAVES: "/EmployeeLeave/my-leaves",
  },

  // ================= HOLIDAYS =================
  HOLIDAYS: {
    LIST: "/Holidays",
    CREATE: "/Holidays",
    UPDATE: (id) => `/Holidays/${id}`,
    DELETE: (id) => `/Holidays/${id}`,
  },

  // ================= JOB OPENINGS =================
  JOBS: {
    LIST: "/JobOpenings",
    CREATE: "/JobOpenings",
    UPDATE: (title) => `/JobOpenings/${title}`,
    DELETE: (title) => `/JobOpenings/${title}`,
  },

  // ================= PROJECTS =================
  PROJECTS: {
    LIST: "/Projects",
    CREATE: "/Projects",
    GET_BY_ID: (id) => `/Projects/${id}`,
    UPDATE: (id) => `/Projects/${id}`,
    DELETE: (id) => `/Projects/${id}`,
  },

  // ================= TASK MANAGEMENT =================
  TASKS: {
    LIST: "/TaskManagement",
    CREATE: "/TaskManagement",
    GET_BY_EMP: (id) => `/TaskManagement/employee/${id}`,
    UPDATE: (id) => `/TaskManagement/${id}`,
    DELETE: (id) => `/TaskManagement/${id}`,
    UPDATE_STATUS: (id) => `/TaskManagement/${id}/status`,
    USER_UPDATE: (id) => `/TaskManagement/user/update-status/${id}`,
    MY_TASKS: "/TaskManagement/my-tasks",
  },

  // ================= ROLES =================
  ROLES: {
    LIST: "/Roles",
    CREATE: "/Roles",
    UPDATE: (id) => `/Roles/${id}`,
    DELETE: (id) => `/Roles/${id}`,
  },

  // ================= ROLE PERMISSION =================
  ROLE_PERMISSION: {
    GET: (roleName) => `/RolePermission/${roleName}`,
    SAVE: "/RolePermission/save",
    MODULES: "/RolePermission/allowed-modules",
  },

  // ================= REPORTS =================
  REPORTS: {
    ALL: "/reports/all",
  },

  // ================= PAYSLIP =================
  PAYSLIP: {
    // Kept as PaySlip because that is what the current app/backend uses.
    GENERATE: "/PaySlip/generate",
    GENERATE_ALL: "/PaySlip/generate-all",
    RECENT: "/PaySlip/recent",
    PREVIEW: (id) => `/PaySlip/preview/${id}`,
    DOWNLOAD: (id) => `/PaySlip/download/${id}`,
    MY: "/PaySlip/my",
    MANUAL_GENERATE: "/manual-payslip/generate",
  },

  // ================= OFFER LETTER =================
  OFFER: {
    // Kept Generate casing to match the current working backend route.
    GENERATE: "/OfferLetter/Generate",
    LIST: "/OfferLetter/all",
    DOWNLOAD: (id) => `/OfferLetter/download/${id}`,
  },

  // ================= EXPERIENCE LETTER =================
  EXPERIENCE_LETTER: {
    GENERATE: "/ExperienceOfferLetter/generate",
    LIST: "/ExperienceOfferLetter/all",
    DOWNLOAD: (id) => `/ExperienceOfferLetter/download/${id}`,
  },

  // ================= SEARCH =================
  SEARCH: {
    MODULE: "/ModuleSearch/search",
  },

  // ================= LEAVE BALANCE =================
  LEAVE_BALANCE: {
    GET: (id) => `/LeaveBalance/${id}`,
  },
};

export const API_ENDPOINTS = {
  auth: {
    adminLogin: API.AUTH.ADMIN_LOGIN,
    userLogin: API.AUTH.USER_LOGIN,
    userRegister: API.AUTH.REGISTER,
    adminForgotPassword: API.AUTH.ADMIN.FORGOT_PASSWORD,
    adminVerifyOtp: API.AUTH.ADMIN.VERIFY_OTP,
    adminResetPassword: API.AUTH.ADMIN.RESET_PASSWORD,
    userForgotPassword: API.AUTH.USER.FORGOT_PASSWORD,
    userVerifyOtp: API.AUTH.USER.VERIFY_OTP,
    userResetPassword: API.AUTH.USER.RESET_PASSWORD,
    // Backward-compatible aliases used by current screens.
    forgotPassword: API.AUTH.ADMIN.FORGOT_PASSWORD,
    verifyOtp: API.AUTH.ADMIN.VERIFY_OTP,
    resetPassword: API.AUTH.ADMIN.RESET_PASSWORD,
    forgotPasswordByRole: (role = "admin") =>
      String(role).toLowerCase() === "user"
        ? API.AUTH.USER.FORGOT_PASSWORD
        : API.AUTH.ADMIN.FORGOT_PASSWORD,
    verifyOtpByRole: (role = "admin") =>
      String(role).toLowerCase() === "user"
        ? API.AUTH.USER.VERIFY_OTP
        : API.AUTH.ADMIN.VERIFY_OTP,
    resetPasswordByRole: (role = "admin") =>
      String(role).toLowerCase() === "user"
        ? API.AUTH.USER.RESET_PASSWORD
        : API.AUTH.ADMIN.RESET_PASSWORD,
  },
  rolePermission: {
    allowedModules: API.ROLE_PERMISSION.MODULES,
    byRoleName: API.ROLE_PERMISSION.GET,
    save: API.ROLE_PERMISSION.SAVE,
  },
  dashboard: API.DASHBOARD.ADMIN,
  userDashboard: API.DASHBOARD.USER,
  departments: {
    list: API.DEPARTMENTS.LIST,
    byId: API.DEPARTMENTS.GET_BY_ID,
  },
  employees: {
    list: API.EMPLOYEES.LIST,
    byId: API.EMPLOYEES.UPDATE,
  },
  employeeFullDetail: {
    byId: API.EMPLOYEE_FULL.GET_BY_ID,
    myDetails: API.EMPLOYEE_FULL.MY_DETAILS,
  },
  employeePersonalInfo: {
    list: API.EMPLOYEE_PERSONAL.LIST,
    byEmployeeId: API.EMPLOYEE_PERSONAL.GET_BY_ID,
  },
  employeeBankDetails: {
    list: API.BANK.LIST,
    byEmployeeId: API.BANK.UPDATE,
  },
  employeeEducation: {
    list: API.EDUCATION.CREATE,
    byEmployeeId: API.EDUCATION.GET_BY_ID,
  },
  employeeExperience: {
    list: API.EXPERIENCE.CREATE,
    byEmployeeId: API.EXPERIENCE.UPDATE,
  },
  company: {
    // 🔥 ADD THIS (MAIN COMPANY APIs)
    create: "/Company",
    getById: (id) => `/Company/${id}`,
    update: (id) => `/Company/${id}`,

    // EXISTING
    branches: {
      list: API.BRANCHES.LIST,
      byId: API.BRANCHES.UPDATE,
    },
    holidays: {
      list: API.HOLIDAYS.LIST,
      byId: API.HOLIDAYS.UPDATE,
    },
    projects: {
      list: API.PROJECTS.LIST,
      byId: API.PROJECTS.UPDATE,
    },
  },
  
  masters: {
    roles: {
      list: API.ROLES.LIST,
      byId: API.ROLES.UPDATE,
    },
    clients: {
      list: API.CLIENTS.LIST,
      byId: API.CLIENTS.UPDATE,
    },
    assets: {
      list: API.ASSETS.LIST,
      byId: API.ASSETS.UPDATE,
    },
  },
  attendance: {
    checkIn: API.ATTENDANCE.CHECKIN,
    checkOut: API.ATTENDANCE.CHECKOUT,
    weekly: API.ATTENDANCE.WEEKLY,
    previousWeek: API.ATTENDANCE.PREVIOUS_WEEK,
    previousMonth: API.ATTENDANCE.PREVIOUS_MONTH,
    today: API.ATTENDANCE.TODAY,
    monthly: API.ATTENDANCE.MONTHLY,
    adminUpdate: API.ATTENDANCE.UPDATE,
  },
  leave: {
    list: API.LEAVE.LIST,
    all: API.LEAVE.ALL,
    balance: API.LEAVE.BALANCE,
    byId: API.LEAVE.DELETE,
    updateStatus: API.LEAVE.UPDATE_STATUS,
  },
  tasks: {
    list: API.TASKS.LIST,
    byId: API.TASKS.UPDATE,
    myTasks: API.TASKS.MY_TASKS,
    updateUserStatus: API.TASKS.USER_UPDATE,
  },
  notifications: {
    admin: API.ADMIN_NOTIFICATION.LIST,
    adminRead: API.ADMIN_NOTIFICATION.READ,
    adminReadAll: API.ADMIN_NOTIFICATION.READ_ALL,
    user: API.USER_NOTIFICATION.LIST,
    userRead: API.USER_NOTIFICATION.READ,
    userReadAll: API.USER_NOTIFICATION.MARK_ALL,
  },
  payroll: {
    employees: API.EMPLOYEES.LIST,
    myPayslips: API.PAYSLIP.MY,
    recent: API.PAYSLIP.RECENT,
    generate: API.PAYSLIP.GENERATE,
    preview: API.PAYSLIP.PREVIEW,
    download: API.PAYSLIP.DOWNLOAD,
    manualGenerate: API.PAYSLIP.MANUAL_GENERATE,
  },
  offerLetters: {
    list: "/OfferLetter",
    all: API.OFFER.LIST,
    generate: API.OFFER.GENERATE,
    download: API.OFFER.DOWNLOAD,
  },
  reports: {
    all: API.REPORTS.ALL,
  },
};

export const buildApiUrl = (path) =>
  `${BASE_URL}/${normalizePath(path)}`;

export const buildServerUrl = (path) =>
  `${SERVER_URL}/${normalizePath(path)}`;

export const getAuthRoleForEmail = (email = "") =>
  String(email).trim().toLowerCase() === ADMIN_EMAIL ? "admin" : "user";
