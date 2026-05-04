import React, { useState, useEffect } from "react";
import "./AddEmployee.css";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";
 
function Education({ onNext, onBack, employeeId, viewMode, data }) {
  const currentYear = new Date().getFullYear();
 
  const [educations, setEducations] = useState([
    {
      degree: "",
      university: "",
      year: "",
      percentage: "",
      specialization: "",
    },
  ]);
 
  const [errors, setErrors] = useState([]);
  const [serverErrors, setServerErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (!data || data.length === 0) return;
 
    const mapped = data.map((edu) => ({
      degree: edu.degree || "",
      university: edu.universityBoard || "",
      year: edu.yearOfPassing ? String(edu.yearOfPassing) : "",
      percentage:
        edu.percentageCGPA !== undefined && edu.percentageCGPA !== null
          ? String(edu.percentageCGPA)
          : "",
      specialization: edu.specialization || "",
    }));
 
    setEducations(mapped);
  }, [data]);
 
  const handleChange = (index, field, value) => {
    const updated = [...educations];
    updated[index][field] = value;
    setEducations(updated);
   
    // Clear server error for this field when user types
    if (serverErrors[field]) {
      setServerErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
 
  const handleYearChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 4) return;
    handleChange(index, "year", value);
  };
 
  const handlePercentageChange = (index, value) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    handleChange(index, "percentage", value);
  };
 
  const addEducation = () => {
    setEducations([
      ...educations,
      {
        degree: "",
        university: "",
        year: "",
        percentage: "",
        specialization: "",
      },
    ]);
  };
 
  // ✅ REMOVAL HANDLER (Now deletes from server)
  const removeEducation = async (index) => {
    if (educations.length <= 1) return;
 
    // 1. Update Local State immediately (Optimistic UI)
    const updatedList = educations.filter((_, i) => i !== index);
    setEducations(updatedList);
    setErrors([]); // Clear validation errors
 
    // 2. If editing existing data, send the update to the server
    // The PUT endpoint replaces the whole list, so sending the list WITHOUT the deleted item removes it.
    const isEditMode = data && data.length > 0;
 
    if (isEditMode && employeeId) {
      try {
        const payload = updatedList.map((edu) => {
          const yearNum = edu.year ? parseInt(edu.year, 10) : 0;
          const pctStr = edu.percentage ? edu.percentage.replace("%", "").trim() : "0";
         
          return {
            Employee_Id: String(employeeId),
            Degree: edu.degree?.trim() || "",
            UniversityBoard: edu.university?.trim() || "",
            YearOfPassing: isNaN(yearNum) ? 0 : yearNum,
            PercentageCGPA: pctStr, // Backend expects string
            Specialization: edu.specialization?.trim() || "",
          };
        });
 
        console.log("🗑️ Deleting record via PUT (Update List):", payload);
 
        await api.put(
          API_ENDPOINTS.employeeEducation.byEmployeeId(employeeId),
          payload,
          { headers: { "Content-Type": "application/json" } }
        );
       
        console.log("✅ Record removed from server successfully");
       
      } catch (error) {
        console.error("❌ Remove Error:", error);
        alert("Failed to delete record from server. Please try again.");
        // Optional: Revert state if error occurs (complex for multi-item lists)
      }
    }
  };
 
  const validate = () => {
    let newErrors = [];
    let isValid = true;
 
    educations.forEach((edu, index) => {
      let error = {};
 
      if (!edu.degree?.trim()) {
        error.degree = "Degree required";
        isValid = false;
      }
      if (!edu.university?.trim()) {
        error.university = "University required";
        isValid = false;
      }
 
      if (!edu.year) {
        error.year = "Year required";
        isValid = false;
      } else if (!/^\d{4}$/.test(edu.year)) {
        error.year = "Enter valid 4-digit year";
        isValid = false;
      } else {
        const yearNum = parseInt(edu.year, 10);
        if (yearNum < 1900 || yearNum > currentYear) {
          error.year = `Year must be between 1900 and ${currentYear}`;
          isValid = false;
        }
      }
 
      if (!edu.percentage) {
        error.percentage = "Percentage/CGPA required";
        isValid = false;
      } else {
        const val = parseFloat(edu.percentage);
        if (isNaN(val) || val < 0 || val > 100) {
          error.percentage = "Enter a valid number (0-100)";
          isValid = false;
        }
      }
 
      if (!edu.specialization?.trim()) {
        error.specialization = "Specialization required";
        isValid = false;
      }
 
      newErrors[index] = error;
    });
 
    setErrors(newErrors);
    return isValid;
  };
 
  const handleSaveNext = async () => {
    setServerErrors({});
    setSuccessMsg("");
    if (!validate()) return;
 
    if (!employeeId) {
      alert("Employee ID is missing. Please save Personal Info first.");
      return;
    }
 
    setLoading(true);
 
    try {
      // Backend expects a single DTO object for POST (Create)
      // Or a List for PUT (Update) - handled by parent or logic
      // Here assuming we are POSTing a new single record or updating?
      // Based on previous logic, this was POST.
     
      const edu = educations[0];
 
      // ✅ FIX: Backend error log shows PercentageCGPA must be a STRING
      const pctStr = edu.percentage ? edu.percentage.replace("%", "").trim() : "0";
     
      const yearNum = edu.year ? parseInt(edu.year, 10) : 0;
 
      // Check if we are updating or creating
      const isEditMode = data && data.length > 0;
 
      if (isEditMode) {
         // Update Logic (PUT) - Send the whole list
         const payloadList = educations.map((e) => {
            const yNum = e.year ? parseInt(e.year, 10) : 0;
            const pStr = e.percentage ? e.percentage.replace("%", "").trim() : "0";
            return {
              Employee_Id: String(employeeId),
              Degree: e.degree?.trim() || "",
              UniversityBoard: e.university?.trim() || "",
              YearOfPassing: isNaN(yNum) ? 0 : yNum,
              PercentageCGPA: pStr,
              Specialization: e.specialization?.trim() || "",
            };
         });
         
         await api.put(
           API_ENDPOINTS.employeeEducation.byEmployeeId(employeeId),
           payloadList,
           { headers: { "Content-Type": "application/json" } }
         );
      } else {
         // Create Logic (POST) - Send single object
         const payload = {
            Employee_Id: String(employeeId),
            Degree: edu.degree?.trim() || "",
            UniversityBoard: edu.university?.trim() || "",
            YearOfPassing: isNaN(yearNum) ? 0 : yearNum,
            PercentageCGPA: pctStr, // ✅ Send as String to match backend type
            Specialization: edu.specialization?.trim() || "",
         };
 
         await api.post(
           API_ENDPOINTS.employeeEducation.list,
           payload,
           { headers: { "Content-Type": "application/json" } }
         );
      }
 
      console.log("✅ Saved successfully");
      setSuccessMsg("Education saved successfully!");
      setTimeout(() => onNext(), 800);
    } catch (error) {
      const errorData = error.response?.data;
      console.error("❌ Save Failed:", errorData);
 
      if (errorData?.errors) {
        console.table(errorData.errors);
        setServerErrors(errorData.errors);
        alert("Validation failed. Please check the red error messages below each field.");
      } else {
        const msg = errorData?.title || errorData || "Failed to save education details.";
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };
 
  // Helper to get server error for a specific field
  const getServerError = (fieldName) => {
    const key = Object.keys(serverErrors).find(
      (k) => k.toLowerCase() === fieldName.toLowerCase()
    );
    return key ? serverErrors[key]?.join(", ") : null;
  };
 
  return (
    <div className="form-section">
      <h3>Add Educational Qualifications</h3>
 
      {educations.map((edu, index) => (
        <div className="form-card" key={index}>
          <div className="card-header">
            <h4>Qualification {index + 1}</h4>
            {!viewMode && educations.length > 1 && (
              <button type="button" className="remove-btn" onClick={() => removeEducation(index)}>
                Remove
              </button>
            )}
          </div>
 
          <div className="form-grid">
            <div className="form-group">
              <label>Degree*</label>
              <input
                value={edu.degree}
                onChange={(e) => handleChange(index, "degree", e.target.value)}
                disabled={viewMode}
                placeholder="e.g., B.Tech"
                className={errors[index]?.degree || getServerError("Degree") ? "input-error" : ""}
              />
              {errors[index]?.degree && <span className="error">{errors[index].degree}</span>}
              {getServerError("Degree") && <span className="error">{getServerError("Degree")}</span>}
            </div>
 
            <div className="form-group">
              <label>University*</label>
              <input
                value={edu.university}
                onChange={(e) => handleChange(index, "university", e.target.value)}
                disabled={viewMode}
                placeholder="e.g., University of Delhi"
                className={errors[index]?.university || getServerError("UniversityBoard") ? "input-error" : ""}
              />
              {errors[index]?.university && <span className="error">{errors[index].university}</span>}
              {getServerError("UniversityBoard") && <span className="error">{getServerError("UniversityBoard")}</span>}
            </div>
 
            <div className="form-group">
              <label>Year*</label>
              <input
                maxLength="4"
                value={edu.year}
                onChange={(e) => handleYearChange(index, e.target.value)}
                disabled={viewMode}
                placeholder="YYYY"
                className={errors[index]?.year || getServerError("YearOfPassing") ? "input-error" : ""}
              />
              {errors[index]?.year && <span className="error">{errors[index].year}</span>}
              {getServerError("YearOfPassing") && <span className="error">{getServerError("YearOfPassing")}</span>}
            </div>
 
            <div className="form-group">
              <label>Percentage/CGPA*</label>
              <input
                value={edu.percentage}
                onChange={(e) => handlePercentageChange(index, e.target.value)}
                disabled={viewMode}
                placeholder="e.g., 85.5 or 9.2"
                className={errors[index]?.percentage || getServerError("PercentageCGPA") ? "input-error" : ""}
              />
              {errors[index]?.percentage && <span className="error">{errors[index].percentage}</span>}
              {getServerError("PercentageCGPA") && <span className="error">{getServerError("PercentageCGPA")}</span>}
            </div>
 
            <div className="form-group full">
              <label>Specialization*</label>
              <input
                value={edu.specialization}
                onChange={(e) => handleChange(index, "specialization", e.target.value)}
                disabled={viewMode}
                placeholder="e.g., Computer Science"
                className={errors[index]?.specialization || getServerError("Specialization") ? "input-error" : ""}
              />
              {errors[index]?.specialization && <span className="error">{errors[index].specialization}</span>}
              {getServerError("Specialization") && <span className="error">{getServerError("Specialization")}</span>}
            </div>
          </div>
        </div>
      ))}
 
      {!viewMode && (
        <button className="add-btn" onClick={addEducation}>
          + Add Another Education
        </button>
      )}
 
      <div className="step-actions">
        {successMsg && (
          <p style={{ color: "#155724", backgroundColor: "#d4edda", border: "1px solid #c3e6cb", padding: "10px 15px", borderRadius: "6px", marginBottom: "10px", fontWeight: "500" }}>
            {successMsg}
          </p>
        )}
 
        {!viewMode && (
          <>
            <button className="btn secondary" onClick={onBack}>
              Back
            </button>
            <button className="btn primary" onClick={handleSaveNext} disabled={loading}>
              {loading ? "Saving..." : "Save & Next"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
 
export default Education;
 
 