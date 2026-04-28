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
  const [successMsg, setSuccessMsg] = useState("");

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
  };

  const handleYearChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 4) return;

    const updated = [...educations];
    updated[index].year = value;
    setEducations(updated);
  };

  const handlePercentageChange = (index, value) => {
    if (!/^\d*\.?\d*$/.test(value)) return;

    const updated = [...educations];
    updated[index].percentage = value;
    setEducations(updated);
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

  // ✅ REMOVE (employeeId आधारित PUT)
  const removeEducation = async (index) => {
    const updatedList = educations.filter((_, i) => i !== index);
    setEducations(updatedList);

    try {
      const payload = updatedList.map((edu) => ({
        employee_Id: employeeId,
        degree: edu.degree,
        universityBoard: edu.university,
        yearOfPassing: parseInt(edu.year),
        percentageCGPA: edu.percentage,
        specialization: edu.specialization,
      }));

      await api.put(
        API_ENDPOINTS.employeeEducation.byEmployeeId(employeeId),
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete education");
    }
  };

  const validate = () => {
    let newErrors = [];

    educations.forEach((edu, index) => {
      let error = {};

      if (!edu.degree) error.degree = "Degree required";
      if (!edu.university) error.university = "University required";

      if (!edu.year) error.year = "Year required";
      else if (!/^\d{4}$/.test(edu.year)) error.year = "Enter valid year";
      else if (parseInt(edu.year) < 1900 || parseInt(edu.year) > currentYear)
        error.year = `Year must be between 1900 and ${currentYear}`;

      if (!edu.percentage) error.percentage = "Percentage required";
      if (!edu.specialization) error.specialization = "Specialization required";

      newErrors[index] = error;
    });

    setErrors(newErrors);
    return newErrors.every((err) => Object.keys(err).length === 0);
  };

  const handleSaveNext = async () => {
    if (!validate()) return;

    if (!employeeId) {
      alert("Employee ID missing.");
      return;
    }

    try {
      const payload = educations.map((edu) => ({
        employee_Id: employeeId,
        degree: edu.degree,
        universityBoard: edu.university,
        yearOfPassing: parseInt(edu.year),
        percentageCGPA: edu.percentage,
        specialization: edu.specialization,
      }));

      const isEdit = data && data.length > 0;

      if (isEdit) {
        await api.put(
          API_ENDPOINTS.employeeEducation.byEmployeeId(employeeId),
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        await api.post(API_ENDPOINTS.employeeEducation.list, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      setSuccessMsg("Education saved successfully!");

      setTimeout(() => {
        onNext();
      }, 800);
    } catch (error) {
      console.error("Save Error:", error);
      alert("Save failed.");
    }
  };

  return (
    <div className="form-section">
      <h3>Add Educational Qualifications</h3>

      {educations.map((edu, index) => (
        <div className="form-card" key={index}>
          <div className="card-header">
            <h4>Qualification {index + 1}</h4>

            {!viewMode && educations.length > 1 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeEducation(index)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Degree*</label>
              <input
                value={edu.degree}
                onChange={(e) =>
                  handleChange(index, "degree", e.target.value)
                }
                disabled={viewMode}
              />
              {errors[index]?.degree && (
                <span className="error">{errors[index].degree}</span>
              )}
            </div>

            <div className="form-group">
              <label>University*</label>
              <input
                value={edu.university}
                onChange={(e) =>
                  handleChange(index, "university", e.target.value)
                }
                disabled={viewMode}
              />
              {errors[index]?.university && (
                <span className="error">{errors[index].university}</span>
              )}
            </div>

            <div className="form-group">
              <label>Year*</label>
              <input
                maxLength="4"
                value={edu.year}
                onChange={(e) =>
                  handleYearChange(index, e.target.value)
                }
                disabled={viewMode}
              />
              {errors[index]?.year && (
                <span className="error">{errors[index].year}</span>
              )}
            </div>

            <div className="form-group">
              <label>Percentage*</label>
              <input
                value={edu.percentage}
                onChange={(e) =>
                  handlePercentageChange(index, e.target.value)
                }
                disabled={viewMode}
              />
              {errors[index]?.percentage && (
                <span className="error">{errors[index].percentage}</span>
              )}
            </div>

            <div className="form-group full">
              <label>Specialization*</label>
              <input
                value={edu.specialization}
                onChange={(e) =>
                  handleChange(index, "specialization", e.target.value)
                }
                disabled={viewMode}
              />
              {errors[index]?.specialization && (
                <span className="error">
                  {errors[index].specialization}
                </span>
              )}
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
          <button className="btn secondary" onClick={onBack}>
            Back
          </button>
        )}

        {!viewMode && (
          <button className="btn primary" onClick={handleSaveNext}>
            Save & Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Education;
