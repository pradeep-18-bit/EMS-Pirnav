import React, { useState, useEffect } from "react";
import "./EmployeeList.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function EmployeeList() {
  const navigate = useNavigate();
  const [empList, setEmpList] = useState([]);
  const [empSearch, setEmpSearch] = useState("");
  useEffect(() => {

    const loadData = async () => {
      try {

        // 1️⃣ Get roles
        const roleRes = await api.get(API_ENDPOINTS.masters.roles.list);

        const roleData =
          roleRes?.data?.data?.$values ||
          roleRes?.data?.data ||
          roleRes?.data ||
          [];

        const formattedRoles = roleData.map(r => ({
          roleId: r.roleId || r.id,
          roleName: r.roleName || r.name
        }));

        setRoles(formattedRoles);

        console.log("ROLE DATA:", roleData);
        // 2️⃣ Get employees
        const empRes = await api.get(API_ENDPOINTS.employees.list);

        const employees = Array.isArray(empRes.data)
          ? empRes.data
          : empRes.data.data || [];

        const mapped = employees.map(emp => {
          const roleObj = roleData.find(
            r => String(r.roleId || r.id) === String(emp.roleId)
          );

          return {
            id: emp.employee_id || emp.employee_Id || "-",
            name: emp.name || "-",
            email: emp.email || "-",
            dept: emp.department || "-",
            ctc: emp.ctc
              ? Number(emp.ctc).toLocaleString("en-IN")
              : "-",
            role: roleObj ? roleObj.name : emp.roleName || "-",
            roleId:
              roleObj?.id ||
              roleData.find((r) => r.name === emp.roleName)?.id ||
              "",
            status: emp.status || "-",
            joined: emp.joiningDate
              ? emp.joiningDate.split("T")[0]
              : "-"
          };

        });

        const sorted = mapped.sort(
          (a, b) => new Date(b.joined) - new Date(a.joined)
        );

        setEmpList(sorted);

      } catch (err) {
        console.error("Data load error:", err);
      }
    };

    loadData();

  }, []);

  const [empShowModal, setEmpShowModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {

    const fetchDepartments = async () => {

      try {

        const response = await api.get(API_ENDPOINTS.departments.list);

        setDepartments(response.data);

      } catch (error) {
        console.error("Department fetch error:", error);
      }

    };

    fetchDepartments();

  }, []);

  const [newDept, setNewDept] = useState("");
  const [newRole, setNewRole] = useState("");
  const [errors, setErrors] = useState({});
  const [empForm, setEmpForm] = useState({
    id: "",
    name: "",
    email: "",
    dept: "",
    ctc: "",
    roleId: "",
    status: "",
    joined: ""
  });
  const getNextEmployeeId = () => {

    const ids = empList
      .map(e => {
        const num = String(e.id).replace(/\D/g, ""); // remove EMP
        return parseInt(num);
      })
      .filter(id => !isNaN(id));

    const maxId = ids.length ? Math.max(...ids) : 0;

    return "EMP" + String(maxId + 1).padStart(3, "0");
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.employees.list);

      console.log("GET RESPONSE:", res.data);

      // support both: {data:[...]} AND [...]
      const employees = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      const mapped = employees.map(emp => {

        const roleObj = roles.find(
          r => String(r.roleId) === String(emp.roleId)
        );

        return {
          id: emp.employee_id || emp.employee_Id || "-",
          name: emp.name || "-",
          email: emp.email || "-",
          dept: emp.department || "-",
          ctc: emp.ctc || "-",
          role: roleObj ? roleObj.roleName : emp.roleName || "-",
          roleId:
            roleObj?.roleId ||
            roles.find((r) => r.roleName === emp.roleName)?.roleId ||
            "",
          status: emp.status || "-",
          joined: emp.joiningDate
            ? emp.joiningDate.split("T")[0]
            : "-"
        };

      });

      const sorted = mapped.sort(
        (a, b) => new Date(b.joined) - new Date(a.joined)
      );

      setEmpList(sorted);

    } catch (err) {
      console.error("GET ERROR:", err.response?.data || err.message);
    }
  };
  const handleEmpChange = (e) => {
    setEmpForm({ ...empForm, [e.target.name]: e.target.value });
  };

  const generateEmpId = () => {
    const ids = empList
      .map(e => parseInt(e.id))
      .filter(id => !isNaN(id));

    const maxId = ids.length ? Math.max(...ids) : 0;

    return maxId + 1;
  };

  const validateEmployee = () => {

    let newErrors = {};

    if (!empForm.id.trim()) {
      newErrors.id = "Employee ID is required";
    }

    if (!empForm.name.trim()) {
      newErrors.name = "Employee name is required";
    } else if (empForm.name.length > 28) {
      newErrors.name = "Name must be less than or equal to 30 characters";
    }

    if (!empForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(empForm.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!empForm.dept) {
      newErrors.dept = "Department is required";
    }

    if (!empForm.roleId) {
      newErrors.roleId = "Role is required";
    }

    if (!empForm.status) {
      newErrors.status = "Status is required";
    }

    if (!empForm.joined) {
      newErrors.joined = "Joining date is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ================= UPDATE EMPLOYEE =================
  const handleUpdateEmployee = async () => {
    if (!validateEmployee()) return;

    try {
      const selectedRole = roles.find(
        (r) => String(r.roleId) === String(empForm.roleId)
      );

      const payload = {
        employee_Id: empForm.id,
        name: empForm.name,
        email: empForm.email,
        department: empForm.dept,

        // ✅ CORRECT FIELD
        roleName: selectedRole?.roleName || "",

        status: empForm.status,
        joiningDate: new Date(empForm.joined).toISOString(),
        ctc: empForm.ctc ? Number(empForm.ctc) : 0
      };

      console.log("UPDATE PAYLOAD:", payload);

      await api.put(
        API_ENDPOINTS.employees.byId(empForm.id),
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      setMessage("Employee Updated ✅");
      setMessageType("success");
      fetchEmployees();
      setEmpShowModal(false);

    } catch (err) {
      console.error("PUT ERROR:", err.response?.data || err.message);
      setMessage("Update Failed ❌");
      setMessageType("error");
    }
  };
  // ================= ADD EMPLOYEE =================
  const handleAddEmployee = async () => {
    if (!validateEmployee()) return;

    try {
      // ✅ ADD THIS (MISSING LINE)
      const selectedRole = roles.find(
        (r) => String(r.roleId) === String(empForm.roleId)
      );

      const payload = {
        employee_Id: empForm.id,
        name: empForm.name,
        email: empForm.email,
        department: empForm.dept,

        // ✅ FIX
        roleName: selectedRole?.roleName || "",

        status: empForm.status,
        joiningDate: new Date(empForm.joined).toISOString(),
        ctc: empForm.ctc ? Number(empForm.ctc) : 0
      };
      console.log("POST PAYLOAD:", payload);

      await api.post(
        API_ENDPOINTS.employees.list,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      setMessage("Employee Added ✅");
      setMessageType("success");
      fetchEmployees();
      setEmpShowModal(false);

    } catch (err) {
      console.error("POST ERROR:", err.response?.data || err.message);

      const msg = err.response?.data?.message || "";

      // 🔥 ADD THIS LOGIC HERE
      if (msg.toLowerCase().includes("employee")) {
        setMessage("Employee ID already exists ❌");
      } else if (msg.toLowerCase().includes("email")) {
        setMessage("Email already exists ❌");
      } else {
        setMessage(msg || "Add Failed ❌");
      }

      setMessageType("error");
    }
  };

  // ================= CONFIRM DELETE EMPLOYEE =================

  const confirmDeleteEmployee = async () => {

    if (!employeeToDelete) return;

    try {

      await api.delete(API_ENDPOINTS.employees.byId(employeeToDelete));

      setShowDeletePopup(false);
      setEmployeeToDelete(null);
      fetchEmployees();

    } catch (err) {
      console.error("DELETE ERROR:", err.response?.data || err.message);
      setMessage("Delete Failed ❌");
      setMessageType("error");
    }
  };
  const handleAddDept = () => {
    if (!newDept.trim()) return;
    if (!departments.includes(newDept)) {
      setDepartments(prev => [
        ...prev,
        { departmentName: newDept }
      ]);
    }
    setNewDept("");
  };

  const handleDeleteDept = (dept) => {

    const used = empList.some(emp => emp.dept === dept);

    if (used) {
      setMessage("Department already assigned to employee");
      setMessageType("error");
      return;
    }

    setDepartments(prev =>
      prev.filter(d => d.departmentName !== dept)
    );
  };

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    if (!roles.some(r => r.roleName === newRole)) {
      setRoles(prev => [
        ...prev,
        { roleId: Date.now(), roleName: newRole }
      ]);
    }
    setNewRole("");
  };

  const handleDeleteRole = (roleName) => {
    const used = empList.some(emp => emp.role === roleName);

    if (used) {
      setMessage("Role already assigned to employee");
      setMessageType("error");
      return;
    }

    setRoles(prev => prev.filter(r => r.roleName !== roleName));
  };
  const filtered = empList.filter(emp =>
    (emp.name || "").toLowerCase().includes(empSearch.toLowerCase())
  );
  return (
    <div className="emp-page-unique">
      {message && (
        <div className={`emp-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* HEADER */}
      <div className="emp-header-unique">
        <div>
          <h2>Employees</h2>
          <p>{empList.length} employees total</p>
        </div>

        <div className="emp-header-actions">

          <button
            className="emp-add-btn"
            onClick={() => {
              setEmpForm({
                id: "",
                name: "",
                email: "",
                dept: "",
                ctc: "",
                roleId: "",
                status: "",
                joined: ""
              });
              setErrors({});
              setEmpShowModal(true);
            }}
          >
            + Add Employee
          </button>

        </div>
      </div>

      <input
        className="emp-search-box"
        type="text"
        placeholder="Search by name..."
        value={empSearch}
        onChange={(e) => setEmpSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="emp-table-container">
        <table className="emp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Email</th>
              <th>Department</th>
              <th>Ctc</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr
                key={emp.id}
                className="emp-row-click"
                onClick={() => navigate(`/add-employee/${emp.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <div
                    className="emp-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/add-employee/${emp.id}`);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {emp.name}
                  </div>
                  <div className="emp-id">{emp.id}</div>
                </td>
                <td>{emp.email}</td>
                <td>{emp.dept}</td>
                <td>{emp.ctc}</td>
                <td>{emp.role}</td>
                <td>{emp.status}</td>
                <td>{emp.joined}</td>

                <td>
                  <div className="action-btns">
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();

                        setEmpForm({
                          id: emp.id,
                          name: emp.name,
                          email: emp.email,
                          dept: emp.dept,
                          ctc: String(emp.ctc).replace(/,/g, ""), // ✅ REMOVE commas
                          roleId: emp.roleId,
                          status: emp.status,
                          joined: emp.joined
                        });

                        setEmpShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmployeeToDelete(emp?.id);
                        setShowDeletePopup(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* EMPLOYEE MODAL */}
      {empShowModal && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-box">

            <h3>
              {empList.some(e => e.id === empForm.id)
                ? "Edit Employee"
                : "Add Employee"}
            </h3>
            <input
              name="id"
              value={empForm.id}
              onChange={handleEmpChange}
              placeholder="Employee ID (Ex: P401)"
            />
            {errors.id && <p className="form-error">{errors.id}</p>}
            <input name="name"
              value={empForm.name}
              onChange={handleEmpChange}
              placeholder="Name" />
            {errors.name && <p className="form-error">{errors.name}</p>}
            <input name="email"
              value={empForm.email}
              onChange={handleEmpChange}
              placeholder="Email" />
            {errors.email && <p className="form-error">{errors.email}</p>}
            <input
              name="ctc"
              value={empForm.ctc}
              onChange={(e) => {
                const value = e.target.value;

                // ✅ only numbers, max 10 digits
                if (/^\d{0,10}$/.test(value)) {
                  setEmpForm({ ...empForm, ctc: value });
                }
              }}
              placeholder="CTC"
            />
            <select
              name="dept"
              value={empForm.dept}
              onChange={handleEmpChange}
            >
              <option value="">Select Department</option>

              {departments.map((dept) => (
                <option key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </option>
              ))}
            </select>

            {errors.dept && <p className="form-error">{errors.dept}</p>}

            <select
              name="roleId"
              value={empForm.roleId}
              onChange={handleEmpChange}
            >
              <option value="">Select Role</option>

              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.roleName}
                  </option>
                ))
              ) : (
                <option disabled>No roles available</option>
              )}
            </select>

            {errors.roleId && <p className="form-error">{errors.roleId}</p>}

            <select name="status"
              value={empForm.status}
              onChange={handleEmpChange}>
              <option value="">Select Status</option>
              <option>Active</option>
              <option>On Leave</option>
              <option>Probation</option>
            </select>

            {errors.status && <p className="form-error">{errors.status}</p>}

            <input type="date"
              name="joined"
              value={empForm.joined}
              onChange={handleEmpChange} />

            {errors.joined && <p className="form-error">{errors.joined}</p>}

            <div className="emp-modal-btns">
              <button
                className="emp-close-btn"
                onClick={() => setEmpShowModal(false)}
              >
                Close
              </button>
              <button
                className="emp-save-btn"
                onClick={
                  empList.some(e => e.id === empForm.id)
                    ? handleUpdateEmployee
                    : handleAddEmployee
                }
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-box small">

            <h3>Manage Departments</h3>

            {/* ADD AT TOP */}
            <div className="master-add">
              <input
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="New Department"
              />
              <button
                className="emp-save-btn"
                onClick={handleAddDept}>
                Add
              </button>
            </div>

            {/* LIST */}
            {departments.map((d, i) => (
              <div className="master-item" key={i}>
                {d.departmentName}
                <button onClick={() => handleDeleteDept(d.departmentName)}>✖</button>
              </div>
            ))}

            <div className="emp-modal-btns">
              <button
                className="emp-close-btn"
                onClick={() => setShowDeptModal(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {showRoleModal && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-box small">

            <h3>Manage Roles</h3>

            {/* ADD AT TOP */}
            <div className="master-add">
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="New Role"
              />
              <button
                className="emp-save-btn"
                onClick={handleAddRole}>
                Add
              </button>
            </div>

            {/* LIST */}
            {roles.map((r, i) => (
              <div className="master-item" key={i}>
                {r.roleName}
                <button onClick={() => handleDeleteRole(r.roleName)}>✖</button>
              </div>
            ))}

            <div className="emp-modal-btns">
              <button
                className="emp-close-btn"
                onClick={() => setShowRoleModal(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      {showDeletePopup && (
        <div className="emp-delete-overlay">
          <div className="emp-delete-modal">

            <h3>Confirm Delete</h3>

            <p style={{ marginBottom: "35px" }}>
              Are you sure you want to delete this employee?
            </p>

            <div className="emp-delete-actions">

              <button
                className="emp-delete-cancel-btn"
                onClick={() => {
                  setShowDeletePopup(false);
                  setEmployeeToDelete(null);
                }}
              >
                Cancel
              </button>

              <button
                className="emp-delete-btn"
                onClick={confirmDeleteEmployee}
              >
                Yes, Delete
              </button>

            </div>

          </div>
        </div>
      )}

    </div>

  );
}

export default EmployeeList;
