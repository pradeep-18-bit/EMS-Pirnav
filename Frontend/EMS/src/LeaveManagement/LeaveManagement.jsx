import React, { useState, useEffect } from "react";
import "./LeaveManagement.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function LeaveManagement() {
  const [filter, setFilter] = useState("All");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveData, setLeaveData] = useState([]);

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  /* ================= FETCH LEAVES ================= */
  const fetchLeaves = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.leave.all, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = res.data;
      console.log("📦 Leave API Response:", data);

      setLeaveData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (leaveId, status) => {
    try {
      await api.put(API_ENDPOINTS.leave.updateStatus(leaveId), null, {
        params: { status },
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      console.log("✅ Leave Updated Successfully");

      fetchLeaves();

      if (selectedLeave?.id === leaveId) {
        setSelectedLeave((prev) => ({
          ...prev,
          status,
        }));
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  /* ================= UTIL ================= */
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const calculateDays = (from, to) =>
    Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;

  // ✅ NEW: Short reason for table
  const truncateReason = (text, maxLength = 15) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const filteredLeaves = (leaveData || []).filter(
    (l) => filter === "All" || l.status?.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="leave-page">
      {/* HEADER */}
      <div className="leave-header">
        <div>
          <h2>Leave Management</h2>
          <p>Manage employee leave requests</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="tabs">
        {["All", "Pending", "Approved", "Rejected"].map((tab) => (
          <button
            key={tab}
            className={filter === tab ? "tab active" : "tab"}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="leave-table">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>EMP ID</th>
                <th>EMPLOYEE</th>
                <th>LEAVE TYPE</th>
                <th>DURATION</th>
                <th>DAYS</th>
                <th>REASON</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                    No leave records found
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const days = calculateDays(leave.fromDate, leave.toDate);

                  return (
                    <tr
                      key={leave.id}
                      onClick={() => setSelectedLeave(leave)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{leave.employeeId || "-"}</td>
                      <td>{leave.employeeName || "-"}</td>
                      <td>{leave.leaveType || "-"}</td>

                      <td>
                        {formatDate(leave.fromDate)} — {formatDate(leave.toDate)}
                      </td>

                      <td className="center">{days}</td>

                      {/* ✅ FIXED: Short reason in table */}
                      <td title={leave.reason || "-"}>
                        {truncateReason(leave.reason, 15)}
                      </td>

                      <td>
                        <span className={`status ${leave.status?.toLowerCase()}`}>
                          {leave.status || "Pending"}
                        </span>
                      </td>

                      <td
                        className="action-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="approve-btn"
                          onClick={() => updateStatus(leave.id, "Approved")}
                        >
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => updateStatus(leave.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedLeave && (
        <div className="leave-details-overlay">
          <div className="leave-details-container">
            <h3 className="leave-details-title">Leave Details</h3>

            <div className="leave-details-row">
              <span className="leave-details-label">Emp ID</span>
              <span className="leave-details-value">
                {selectedLeave.employeeId}
              </span>
            </div>

            <div className="leave-details-row">
              <span className="leave-details-label">Name</span>
              <span className="leave-details-value">
                {selectedLeave.employeeName}
              </span>
            </div>

            <div className="leave-details-row">
              <span className="leave-details-label">Type</span>
              <span className="leave-details-value">
                {selectedLeave.leaveType}
              </span>
            </div>

            <div className="leave-details-row">
              <span className="leave-details-label">Duration</span>
              <span className="leave-details-value">
                {formatDate(selectedLeave.fromDate)} —{" "}
                {formatDate(selectedLeave.toDate)}
              </span>
            </div>

            <div className="leave-details-row">
              <span className="leave-details-label">Days</span>
              <span className="leave-details-value">
                {calculateDays(selectedLeave.fromDate, selectedLeave.toDate)}
              </span>
            </div>

            {/* ✅ FULL reason stays in popup */}
            <div className="leave-details-row">
              <span className="leave-details-label">Reason</span>
              <span className="leave-details-value">
                {selectedLeave.reason || "-"}
              </span>
            </div>

            <div className="leave-details-row">
              <span className="leave-details-label">Status</span>
              <span
                className={`leave-details-value leave-status-${selectedLeave.status?.toLowerCase()}`}
              >
                {selectedLeave.status}
              </span>
            </div>

            <div className="leave-details-footer">
              <button
                className="leave-details-close-btn"
                onClick={() => setSelectedLeave(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveManagement;
