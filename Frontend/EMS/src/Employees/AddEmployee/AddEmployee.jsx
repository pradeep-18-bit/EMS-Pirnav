import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS, buildApiUrl } from "../../api/endpoints";
 
import Stepper from "./Stepper";
 
import PersonalInfo from "./PersonalInfo";
import BankInfo from "./BankInfo";
import Education from "./Education";
import Experience from "./Experience";
 
import "./AddEmployee.css";
 
function AddEmployee() {
  const { id } = useParams();
  const viewMode = Boolean(id); // ✅ ADMIN CHECK
 
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
 
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
          res = await api.get(
            API_ENDPOINTS.employeeFullDetail.byId(id),
            config
          );
        } else {
          res = await api.get(
            API_ENDPOINTS.employeeFullDetail.myDetails,
            config
          );
        }
 
        setEmployeeData(res.data || {});
 
        if (res.data?.employeeId) {
          setEmployeeId(res.data.employeeId);
        } else if (res.data?.id) {
          setEmployeeId(res.data.id);
        }
      } catch (err) {
        console.error("Employee fetch error:", err);
      }
    };
 
    fetchEmployeeDetails();
  }, [id]);
 
  // ✅ ADMIN: UNLOCK ALL STEPS
  useEffect(() => {
    if (viewMode) {
      setMaxStep(4);
    }
  }, [viewMode]);
 
  // ================= NEXT HANDLERS =================
 
  const nextFromPersonal = (empId) => {
    setEmployeeId(empId);
    setStep(2);
    setMaxStep((prev) => Math.max(prev, 2));
  };
 
  const nextFromBank = () => {
    if (bankRef.current?.validate?.()) {
      setStep(3);
      setMaxStep((prev) => Math.max(prev, 3));
    }
  };
 
  const nextFromEducation = () => {
    setStep(4);
    setMaxStep((prev) => Math.max(prev, 4));
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
              ? "Admin can navigate all steps directly"
              : isEditing
              ? "You can now edit your profile details"
              : "View your profile details"}
          </p>
        </div>
 
        {!id && (
          <button className="edit-profile-btn" onClick={handleEditToggle}>
            {isEditing ? "Cancel Edit" : "Edit"}
          </button>
        )}
      </div>
 
      {/* ✅ STEPPER FIXED FOR ADMIN */}
      <Stepper
        step={step}
        setStep={setStep}
        maxStep={viewMode ? 4 : maxStep}
      />
 
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
 