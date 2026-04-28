import React, { useState, useEffect } from "react";
import "./Roles.css";
import { FaShieldAlt, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolesShowModal, setRolesShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [rolesForm, setRolesForm] = useState({
    roleName: "",
    status: "Active"
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);

    try {
      const res = await api.get(API_ENDPOINTS.masters.roles.list);

      const rawData = Array.isArray(res.data) ? res.data : [];

      const formattedData = rawData.map((r) => ({
        roleId: r.id,
        roleName: r.name || "No Name",
        status: "Active",
        users: r.usersCount || 0
      }));

      setRoles(formattedData);
    } catch (error) {
      console.error(error);
      setRoles([]);
      toast.error(error.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleRolesChange = (e) => {
    const { name, value } = e.target;
    setRolesForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRolesSubmit = async () => {
    if (!rolesForm.roleName.trim()) {
      toast.warning("Please enter role name");
      return;
    }

    const payload = {
      name: rolesForm.roleName.trim(),
      status: rolesForm.status
    };

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(
          API_ENDPOINTS.masters.roles.byId(selectedRoleId),
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            }
          }
        );

        toast.success("Role updated successfully");
      } else {
        await api.post(API_ENDPOINTS.masters.roles.list, payload, {
          headers: {
            "Content-Type": "application/json",
          }
        });

        toast.success("Role added successfully");
      }

      resetForm();
      fetchRoles();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(API_ENDPOINTS.masters.roles.byId(id));

      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error) {
      console.error(error);

      const msg = error.response?.data || "";

      if (msg.includes("assigned to users")) {
        toast.error("This role is assigned to users");
      } else {
        toast.error("Unable to delete role");
      }
    }
  };

  const handleEditClick = (role) => {
    setIsEdit(true);
    setSelectedRoleId(role.roleId);

    setRolesForm({
      roleName: role.roleName,
      status: role.status
    });

    setRolesShowModal(true);
  };

  const resetForm = () => {
    setRolesForm({ roleName: "", status: "Active" });
    setIsEdit(false);
    setSelectedRoleId(null);
    setRolesShowModal(false);
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading roles...</p>;
  }

  return (
    <div className="roles-page-container">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        style={{ zIndex: 9999 }}
      />
      <div className="roles-header-bar">
        <div>
          <h2>Roles & Permissions</h2>
        </div>

        <button
          className="roles-add-btn"
          onClick={() => {
            setIsEdit(false);
            setRolesShowModal(true);
          }}
        >
          + Add Role
        </button>
      </div>

      <table className="roles-table-main">
        <thead>
          <tr>
            <th>Role</th>
            <th>Users</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {roles.map((r, i) => (
            <tr key={r.roleId || i}>
              <td
                className="roles-name-cell"
                onClick={() =>
                  navigate(`/employee-permissions/${r.roleId}/${r.roleName}`)
                }
              >
                <div className="roles-icon-box">
                  <FaShieldAlt />
                </div>
                {r.roleName}
              </td>

              <td>{r.users}</td>
              <td>{r.status}</td>

              <td>
                <FaEdit
                  style={{ cursor: "pointer", marginRight: "10px" }}
                  onClick={() => handleEditClick(r)}
                />

                <FaTrash
                  style={{
                    cursor: r.users > 0 ? "not-allowed" : "pointer",
                    color: r.users > 0 ? "gray" : "red",
                    opacity: r.users > 0 ? 0.5 : 1
                  }}
                  onClick={() => {
                    if (r.users > 0) {
                      toast.warning("Role already assigned to users");
                      return;
                    }
                    handleDelete(r.roleId);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rolesShowModal && (
        <div className="roles-modal-overlay">
          <div className="roles-modal-container">
            <h3>{isEdit ? "Edit Role" : "Add Role"}</h3>

            <input
              type="text"
              name="roleName"
              value={rolesForm.roleName}
              onChange={handleRolesChange}
              placeholder="Enter role"
            />

            <select
              name="status"
              value={rolesForm.status}
              onChange={handleRolesChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div>
              <button onClick={resetForm}>Cancel</button>

              <button onClick={handleRolesSubmit} disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
