import React, { useState, useEffect } from "react";
import "./AddEmployee.css";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";

function Experience({ employeeId, viewMode, data, onNext }) {
  const emptyExperience = {
    company: "",
    designation: "",
    from: "",
    to: "",
    years: "",
    reason: "",
    description: "",
  };

  const [experiences, setExperiences] = useState([emptyExperience]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!data || data.length === 0) return;

    console.log("📥 Incoming data:", data);

    const mapped = data.map((exp) => ({
      company: exp.companyName || "",
      designation: exp.designation || "",
      from: exp.fromDate ? exp.fromDate.split("T")[0] : "",
      to: exp.toDate ? exp.toDate.split("T")[0] : "",
      years: exp.years ? String(exp.years) : "",
      reason: exp.reasonForLeaving || "",
      description: exp.description || "",
    }));

    setExperiences(mapped);
  }, [data]);

  const handleChange = (index, e) => {
    const updated = [...experiences];
    updated[index][e.target.name] = e.target.value;
    setExperiences(updated);
  };

  const addExperience = () => {
    setExperiences([...experiences, { ...emptyExperience }]);
  };

  // ✅ REMOVE = DELETE API + UI UPDATE
  const removeExperience = async (index) => {
    console.log("🗑️ Remove clicked:", index);

    if (!employeeId) {
      alert("Employee ID missing");
      return;
    }

    if (!window.confirm("Delete experience?")) return;

    try {
      setLoading(true);

      const response = await api.delete(
        API_ENDPOINTS.employeeExperience.byEmployeeId(employeeId)
      );

      console.log("📥 Delete Response:", response.data);

      console.log("✅ Deleted from backend");

      // ✅ Update UI
      const updated = experiences.filter((_, i) => i !== index);
      setExperiences(updated.length ? updated : [emptyExperience]);

    } catch (err) {
      console.error("🔥 Delete error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log("🚀 Save clicked");

    if (!employeeId) {
      alert("Employee ID missing");
      return;
    }

    try {
      setLoading(true);

      const exp = experiences[0] || {};

      const payload = {
        Employee_Id: employeeId,
        CompanyName: exp.company?.trim() || "",
        Designation: exp.designation?.trim() || "",
        FromDate: exp.from ? new Date(exp.from).toISOString() : null,
        ToDate: exp.to ? new Date(exp.to).toISOString() : null,
        Years: exp.years ? parseInt(exp.years) : 0,
        ReasonForLeaving: exp.reason?.trim() || "",
        Description: exp.description?.trim() || "",
      };

      console.log("📤 Payload:", payload);

      // ✅ CHECK: if data already exists → UPDATE else INSERT
      const isUpdate = data && data.length > 0;

      const method = isUpdate ? "PUT" : "POST";

      const response = isUpdate
        ? await api.put(
            API_ENDPOINTS.employeeExperience.byEmployeeId(employeeId),
            payload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        : await api.post(API_ENDPOINTS.employeeExperience.list, payload, {
            headers: {
              "Content-Type": "application/json",
            },
          });

      console.log(`📥 ${method} Response:`, response.data);

      setSuccessMsg(`${isUpdate ? "Updated" : "Added"} successfully!`);
    } catch (err) {
      console.error("🔥 Save error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-section">
      <h3>Add Previous Work Experience</h3>

      {experiences.map((exp, index) => (
        <div className="form-card" key={index}>
          <div className="card-header">
            <h4>Experience {index + 1}</h4>

            {!viewMode && experiences.length > 1 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeExperience(index)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="company"
                value={exp.company || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>

            <div className="form-group">
              <label>Designation</label>
              <input
                type="text"
                name="designation"
                value={exp.designation || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>

            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                name="from"
                value={exp.from || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>

            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                name="to"
                value={exp.to || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>

            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                name="years"
                value={exp.years || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>

            <div className="form-group">
              <label>Reason for Leaving</label>
              <input
                type="text"
                name="reason"
                value={exp.reason || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>

            <div className="form-group full">
              <label>Description</label>
              <textarea
                name="description"
                value={exp.description || ""}
                onChange={(e) => handleChange(index, e)}
                disabled={viewMode}
              />
            </div>
          </div>
        </div>
      ))}

      {!viewMode && (
        <button type="button" className="add-btn" onClick={addExperience}>
          + Add Another Experience
        </button>
      )}

      <div className="step-actions">

        {successMsg && (
          <p
            style={{
              color: "#28a745",
              backgroundColor: "#e6f9ed",
              border: "1px solid #28a745",
              padding: "10px 15px",
              borderRadius: "6px",
              marginBottom: "10px",
              fontWeight: "500",
            }}
          >
            {successMsg}
          </p>
        )}

        {!viewMode && (
          <button
            type="button"
            className="btn success"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Experience"}
          </button>
        )}

        {!viewMode && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              console.log("⏭️ Skipped Experience");
              setSuccessMsg("Skipped");

              setTimeout(() => {
                if (onNext) {
                  onNext(); // ✅ FIX
                }
              }, 500);
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

export default Experience;
