import React, { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import "./Departments.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS, API } from "../api/endpoints";
 
function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]); // ✅ NEW
  const [selectedDept, setSelectedDept] = useState(null); // ✅ NEW
 
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
 
  const [newDept, setNewDept] = useState({
    name: "",
    head: "",
    members: "",
    building: "",
    status: ""
  });
 
  // ================= FETCH =================
  const fetchDepartments = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.departments.list);
 
      const data = res.data;
 
      const cleaned = Array.isArray(data)
        ? data.map((d) => ({
          ...d,
          membersCount: Math.max(0, d.membersCount || 0)
        }))
        : [];
 
      setDepartments(cleaned);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };
 
  // ✅ FETCH EMPLOYEES
  const fetchEmployees = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.employees.list);
 
      const data = res.data;
      const empData = Array.isArray(data) ? data : data.data || [];
 
      setEmployees(empData);
    } catch (err) {
      console.error("Employee fetch error:", err);
    }
  };
  const createCompany = async () => {
    try {
      const payload = {
        companyName: "TechCorp Solutions Pvt. Ltd.",
        address: "Hyderabad",
        status: "Active"
      };
 
      await api.post(API.COMPANY.CREATE, payload);
 
      console.log("Company created");
    } catch (err) {
      console.error("Create company error:", err);
    }
  };
  const getCompany = async (id) => {
    try {
      const res = await api.get(API.COMPANY.GET_BY_ID(id));
      console.log("Company data:", res.data);
    } catch (err) {
      console.error("Get company error:", err);
    }
  };
  const updateCompany = async (id) => {
    try {
      const payload = {
        id: id, // 🔥 IMPORTANT
        companyName: "TechCorp Updated",
        address: "Bangalore",
        status: "Active"
      };
 
      await api.put(API.COMPANY.UPDATE(id), payload);
 
      console.log("Company updated");
    } catch (err) {
      console.error("Update company error:", err);
    }
  };
 
 useEffect(() => {
  fetchDepartments();
  fetchEmployees();
 
}, []);
 
  // ================= MENU CLOSE =================
  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest(".dept-menu-wrapper")) {
        setActiveMenu(null);
      }
    };
 
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);
 
 
  // ================= INPUT =================
  const handleChange = (e) => {
    setNewDept({
      ...newDept,
      [e.target.name]: e.target.value
    });
  };
 
  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!newDept.name || !newDept.head) {
      alert("Please fill required fields");
      return;
    }
 
    const payload = {
      departmentName: newDept.name,
      departmentHead: newDept.head,
      membersCount: Math.max(0, Number(newDept.members)),
      building: newDept.building,
      status: newDept.status,
      department_Id: editId ? undefined : crypto.randomUUID()
    };
 
    try {
      let response;
 
      if (editId) {
        payload.id = editId;
 
        await api.put(
          API_ENDPOINTS.departments.byId(editId),
          payload
        );
 
      } else {
        await api.post(API_ENDPOINTS.departments.list, payload, {
          headers: {
            "Content-Type": "application/json",
          }
        });
      }
 
      closeModal();
      fetchDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
    }
  };
 
  // ================= EDIT =================
  const handleEdit = (dept) => {
    setEditId(dept.id);
    setNewDept({
      name: dept.departmentName,
      head: dept.departmentHead,
      members: dept.membersCount,
      building: dept.building,
      status: dept.status
    });
    setShowModal(true);
    setActiveMenu(null);
  };
 
  // ================= DELETE =================
  const handleDeleteClick = (id) => {
    setDeptToDelete(id);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };
 
  const confirmDelete = async () => {
    try {
      await api.delete(`/Departments/${deptToDelete}`);
 
      setShowDeleteModal(false);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };
 
  // ================= CLOSE =================
  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setNewDept({
      name: "",
      head: "",
      members: "",
      building: "",
      status: ""
    });
  };
 
  // ================= UI =================
  return (
    <div className="dept-page">
      <div className="dept-header">
        <div>
          <h2>Departments</h2>
          <p>Manage company departments</p>
        </div>
 
        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add Department
        </button>
      </div>
 
      <div className="dept-grid">
        {departments.map((dept) => {
          const deptEmployees = employees.filter(
            (emp) => emp.department === dept.departmentName
          );
 
          return (
            <div
              className="dept-card"
              key={dept.id}
              onClick={() => setSelectedDept(dept)} // ✅ CLICK
            >
              <div className="dept-menu-wrapper">
                <button
                  className="dept-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === dept.id ? null : dept.id);
                  }}
                >
                  ⋮
                </button>
 
                {activeMenu === dept.id && (
                  <div
                    className="dept-popup-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => handleEdit(dept)}>Edit</button>
                    <button
                      className="delete"
                      onClick={() => handleDeleteClick(dept.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
 
              <div className="dept-top">
                <div className="dept-icon">
                  <FaUsers />
                </div>
 
                <span
                  className={
                    dept.status === "Active"
                      ? "dept-status active"
                      : "dept-status inactive"
                  }
                >
                  {dept.status}
                </span>
              </div>
 
              <h3>{dept.departmentName}</h3>
 
              <p className="dept-head">Head: {dept.departmentHead}</p>
 
              <div className="dept-footer">
                <span>👤 {deptEmployees.length} members</span> ✅ FIX
                <span>📍 {dept.building}</span>
              </div>
            </div>
          );
        })}
      </div>
 
      {/* ✅ EMPLOYEE LIST MODAL */}
      {selectedDept && (
        <div
          className="dept-modal-overlay"
          onClick={() => setSelectedDept(null)}
        >
          <div
            className="dept-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedDept.departmentName} Employees</h3>
 
            {employees
              .filter(
                (emp) => emp.department === selectedDept.departmentName
              )
              .map((emp) => (
                <div
                  key={emp.employee_Id || emp.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <b>{emp.name}</b> - {emp.email}
                </div>
              ))}
 
            {employees.filter(
              (emp) => emp.department === selectedDept.departmentName
            ).length === 0 && <p>No employees</p>}
 
            <div style={{ marginTop: "15px", textAlign: "right" }}>
              <button onClick={() => setSelectedDept(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
 
      {/* MODAL */}
      {showModal && (
        <div className="dept-modal-overlay" onClick={closeModal}>
          <div
            className="dept-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editId ? "Edit" : "Add"} Department</h3>
 
            <input name="name" value={newDept.name} onChange={handleChange} placeholder="Name" />
            <input name="head" value={newDept.head} onChange={handleChange} placeholder="Head" />
            <input name="members" type="number" value={newDept.members} onChange={handleChange} placeholder="Members" />
            <input name="building" value={newDept.building} onChange={handleChange} placeholder="Building" />
 
            <select name="status" value={newDept.status} onChange={handleChange}>
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
 
            <div className="dept-modal-btns">
              <button onClick={closeModal}>Cancel</button>
              <button className="dept-save-btn" onClick={handleSubmit}>
                {editId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* DELETE */}
      {showDeleteModal && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure?</p>
 
            <div className="delete-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
 
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default Departments;
 
 