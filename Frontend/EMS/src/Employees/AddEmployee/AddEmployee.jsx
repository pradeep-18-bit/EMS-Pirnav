import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS, buildApiUrl } from "../../api/endpoints";
import PersonalInfo from "./PersonalInfo";
import BankInfo from "./BankInfo";
import Education from "./Education";
import Experience from "./Experience";
import "./AddEmployee.css";

function AddEmployee() {
  const { id } = useParams();
  const viewMode = Boolean(id); // admin view mode if id exists

  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState(id || "");
  const [employeeData, setEmployeeData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const bankRef = useRef();

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("jwtToken");

        const config = {
          headers: {
            "ngrok-skip-browser-warning": "true",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        };

        let res;

        if (id) {
          // Admin/View specific employee
          res = await api.get(
            API_ENDPOINTS.employeeFullDetail.byId(id),
            config
          );
        } else {
          // Logged-in employee self details
          res = await api.get(
            API_ENDPOINTS.employeeFullDetail.myDetails,
            config
          );
        }

        console.log("Employee Details:", res.data);
        setEmployeeData(res.data || {});

        if (res.data?.employeeId) {
          setEmployeeId(res.data.employeeId);
        } else if (res.data?.id) {
          setEmployeeId(res.data.id);
        }
      } catch (err) {
        console.error("Employee fetch error:", err);

        if (err.response?.status === 401) {
          console.error("Unauthorized: Token missing or expired");
        }
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  const nextFromPersonal = (empId) => {
    setEmployeeId(empId);
    setStep(2);
  };

  const nextFromBank = () => {
    if (bankRef.current?.validate?.()) {
      setStep(3);
    }
  };

  const nextFromEducation = () => {
    setStep(4);
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className="add-employee">
      <div className="page-header-row">
        <div>
          <h2 className="page-title">
            {viewMode ? "Employee Details" : "My Profile"}
          </h2>

          <p className="page-subtitle">
            {viewMode
              ? "Admin can only view employee information"
              : isEditing
                ? "You can now edit your profile details"
                : "View your profile details"}
          </p>
        </div>

        {/* Show Edit button only for self profile */}
        {!id && (
          <button className="edit-profile-btn" onClick={handleEditToggle}>
            {isEditing ? "Cancel Edit" : "Edit"}
          </button>
        )}
      </div>

      {/* STEPPER */}
      <div className="stepper">
        <div
          className={`step ${step === 1 ? "active" : ""}`}
          onClick={() => setStep(1)}
        >
          Personal Info
        </div>

        <div
          className={`step ${step === 2 ? "active" : ""}`}
          onClick={() => setStep(2)}
        >
          Bank Info
        </div>

        <div
          className={`step ${step === 3 ? "active" : ""}`}
          onClick={() => setStep(3)}
        >
          Education
        </div>

        <div
          className={`step ${step === 4 ? "active" : ""}`}
          onClick={() => setStep(4)}
        >
          Experience
        </div>
      </div>

      {/* STEP CONTENT */}
      <div className="step-content">
        {step === 1 && (
          <PersonalInfo
            onNext={nextFromPersonal}
            employeeId={employeeId}
            viewMode={id ? true : !isEditing}
            data={employeeData?.personalInfo || null}
            selfProfile={!id}
            updateUrl={buildApiUrl(API_ENDPOINTS.employeeFullDetail.myDetails)}
          />
        )}

        {step === 2 && (
          <BankInfo
            ref={bankRef}
            onBack={() => setStep(1)}
            onNext={nextFromBank}
            employeeId={employeeId}
            viewMode={id ? true : !isEditing}
            data={employeeData?.bankDetails || null}
            selfProfile={!id}
            updateUrl={buildApiUrl(API_ENDPOINTS.employeeFullDetail.myDetails)}
          />
        )}

        {step === 3 && (
          <Education
            onBack={() => setStep(2)}
            onNext={nextFromEducation}
            employeeId={employeeId}
            viewMode={id ? true : !isEditing}
            data={employeeData?.education || []}
            selfProfile={!id}
            updateUrl={buildApiUrl(API_ENDPOINTS.employeeFullDetail.myDetails)}
          />
        )}

        {step === 4 && (
          <Experience
            onBack={() => setStep(3)}
            onNext={() => setStep(1)}
            employeeId={employeeId}
            viewMode={id ? true : !isEditing}
            data={employeeData?.experience || []}
            selfProfile={!id}
            updateUrl={buildApiUrl(API_ENDPOINTS.employeeFullDetail.myDetails)}
          />
        )}
      </div>
    </div>
  );
}

export default AddEmployee;
