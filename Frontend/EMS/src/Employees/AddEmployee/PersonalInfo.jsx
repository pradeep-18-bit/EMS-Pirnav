import React, { useState, useEffect } from "react";
import "./AddEmployee.css";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";

function PersonalInfo({ onNext, viewMode, data }) {
  const initialFormData = {
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    phone: "",
    email: "",
    aadhaar: "",
    pan: "",
    department: "",
    designation: "",
    joiningDate: "",
    workExperience: "",
    bloodGroup: "",
    houseNo: "",
    street: "",
    city: "",
    district: "",
    state: "",
    country: "",
    pincode: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [departments, setDepartments] = useState([]);

  // ✅ Load employee data safely
  useEffect(() => {
    if (!data) return;

    setFormData({
      ...initialFormData, // ✅ ensures no field becomes undefined
      employeeId: String(data.employee_Id ?? ""),
      firstName: String(data.firstName ?? ""),
      middleName: String(data.middleName ?? ""),
      lastName: String(data.lastName ?? ""),
      dob: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
      gender: String(data.gender ?? ""),
      maritalStatus: String(data.marital_Status ?? ""),
      phone: String(data.phoneNumber ?? ""),
      email: String(data.email ?? ""),
      aadhaar: String(data.aadhaarNumber ?? ""),
      pan: String(data.panNumber ?? ""),
      department: String(data.department ?? ""),
      designation: String(data.designation ?? ""),
      joiningDate: data.joiningDate ? data.joiningDate.split("T")[0] : "",
      workExperience:
        data.workExperience !== undefined && data.workExperience !== null
          ? String(data.workExperience)
          : "",
      bloodGroup: String(data.bloodGroup ?? ""),
      houseNo: String(data.houseNo ?? ""),
      street: String(data.street ?? ""),
      city: String(data.city ?? ""),
      district: String(data.district ?? ""),
      state: String(data.state ?? ""),
      country: String(data.country ?? ""),
      pincode: String(data.pincode ?? ""),
    });
  }, [data]);

  // ✅ Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.departments.list);

        setDepartments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Department fetch error:", error);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "phone") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "aadhaar") {
      newValue = value.replace(/\D/g, "").slice(0, 12);
    }

    if (name === "pan") {
      newValue = value.toUpperCase();
    }

    if (name === "houseNo") {
      newValue = value.replace(/[^a-zA-Z0-9\-\/]/g, "").slice(0, 15);
    }

    if (name === "street") {
      newValue = value.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 30);
    }

    if (["city", "district", "state", "country"].includes(name)) {
      newValue = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
    }

    if (name === "pincode") {
      newValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // ✅ clear error instantly while typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.employeeId.trim())
      newErrors.employeeId = "Employee ID is required";

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";

    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required";

    if (!formData.gender) newErrors.gender = "Gender is required";

    if (!formData.maritalStatus)
      newErrors.maritalStatus = "Marital status is required";

    if (!formData.dob) newErrors.dob = "Date of birth is required";

    if (!/^[0-9]{10}$/.test(formData.phone))
      newErrors.phone = "Enter valid 10-digit phone number";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter valid email";

    if (!/^[0-9]{12}$/.test(formData.aadhaar))
      newErrors.aadhaar = "Aadhaar must be 12 digits";

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan))
      newErrors.pan = "Enter valid PAN (e.g., ABCDE1234F)";

    if (!formData.department.trim())
      newErrors.department = "Department is required";

    if (formData.workExperience === "")
      newErrors.workExperience = "Experience is required";

    if (!formData.designation.trim())
      newErrors.designation = "Designation is required";

    if (!formData.joiningDate)
      newErrors.joiningDate = "Joining date is required";

    if (!formData.bloodGroup)
      newErrors.bloodGroup = "Blood group is required";

    if (!formData.houseNo.trim())
      newErrors.houseNo = "House No is required";
    else if (!/^[a-zA-Z0-9\-\/]{1,15}$/.test(formData.houseNo))
      newErrors.houseNo =
        "Max 15 characters. Only letters, numbers, - or / allowed";

    if (!formData.street.trim())
      newErrors.street = "Street is required";
    else if (formData.street.length > 30)
      newErrors.street = "Street cannot exceed 30 characters";

    if (!formData.city.trim())
      newErrors.city = "City is required";
    else if (!/^[A-Za-z\s]{1,30}$/.test(formData.city))
      newErrors.city = "Only alphabets allowed (max 30 characters)";

    if (!formData.district.trim())
      newErrors.district = "District is required";
    else if (!/^[A-Za-z\s]{1,30}$/.test(formData.district))
      newErrors.district = "Only alphabets allowed (max 30 characters)";

    if (!formData.state.trim())
      newErrors.state = "State is required";
    else if (!/^[A-Za-z\s]{1,30}$/.test(formData.state))
      newErrors.state = "Only alphabets allowed (max 30 characters)";

    if (!formData.country.trim())
      newErrors.country = "Country is required";
    else if (!/^[A-Za-z\s]{1,30}$/.test(formData.country))
      newErrors.country = "Only alphabets allowed (max 30 characters)";

    if (!/^[0-9]{6}$/.test(formData.pincode))
      newErrors.pincode = "Enter valid 6-digit pincode";

    return newErrors;
  };
  const handleSave = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      employee_Id: formData.employeeId,
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      dateOfBirth: formData.dob
        ? new Date(formData.dob + "T00:00:00Z").toISOString()
        : null,
      phoneNumber: formData.phone,
      email: formData.email,
      aadhaarNumber: formData.aadhaar,
      panNumber: formData.pan,
      bloodGroup: formData.bloodGroup,
      marital_Status: formData.maritalStatus,
      department: formData.department,
      designation: formData.designation,
      gender: formData.gender,
      location: "India",
      houseNo: formData.houseNo,
      street: formData.street,
      city: formData.city,
      district: formData.district,
      state: formData.state,
      country: formData.country,
      pincode: formData.pincode,
      workExperience: formData.workExperience,
      joiningDate: formData.joiningDate
        ? new Date(formData.joiningDate + "T00:00:00Z").toISOString()
        : null,
    };

    try {
      let response;

      if (data) {
        // ✅ EDIT MODE (existing employee)
        response = await api.put(
          API_ENDPOINTS.employeePersonalInfo.byEmployeeId(formData.employeeId),
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // ✅ CREATE MODE (new employee)
        response = await api.post(
          API_ENDPOINTS.employeePersonalInfo.list,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log("Saved:", response.data);
      setSuccessMsg(data ? "Updated successfully!" : "Saved successfully!");

      setTimeout(() => {
        if (onNext) {
          onNext(formData.employeeId);
        }
      }, 800);

    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);

      // 🔥 Handle duplicate case cleanly
      if (error.response?.data?.message?.includes("already exists")) {
        alert("Employee already exists. Please edit instead.");
      } else {
        alert("Failed to save personal information.");
      }
    }
  };

  const renderError = (field) =>
    errors[field] ? (
      <span
        style={{
          color: "#dc3545",
          backgroundColor: "#fdeaea",
          border: "1px solid #dc3545",
          padding: "5px 10px",
          borderRadius: "4px",
          display: "inline-block",
          marginTop: "5px",
          fontSize: "13px",
        }}
      >
        {errors[field]}
      </span>
    ) : null;

  return (
    <div className="form-section">
      <h3>Personal Information</h3>

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Employee ID<span className="required">*</span></label>
            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} disabled={viewMode} />
            {renderError("employeeId")}
          </div>

          <div className="form-group">
            <label>First Name<span className="required">*</span></label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={viewMode} />
            {renderError("firstName")}
          </div>

          <div className="form-group">
            <label>Middle Name</label>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} disabled={viewMode} />
          </div>

          <div className="form-group">
            <label>Last Name<span className="required">*</span></label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={viewMode} />
            {renderError("lastName")}
          </div>

          <div className="form-group">
            <label>Gender<span className="required">*</span></label>
            <select name="gender" value={formData.gender} onChange={handleChange} disabled={viewMode}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {renderError("gender")}
          </div>

          <div className="form-group">
            <label>Marital Status<span className="required">*</span></label>
            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} disabled={viewMode}>
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
            {renderError("maritalStatus")}
          </div>

          <div className="form-group">
            <label>Date of Birth<span className="required">*</span></label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} disabled={viewMode} />
            {renderError("dob")}
          </div>

          <div className="form-group">
            <label>Phone Number<span className="required">*</span></label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={viewMode} />
            {renderError("phone")}
          </div>

          <div className="form-group">
            <label>Email<span className="required">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={viewMode} />
            {renderError("email")}
          </div>

          <div className="form-group">
            <label>Aadhaar Number<span className="required">*</span></label>
            <input type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} disabled={viewMode} />
            {renderError("aadhaar")}
          </div>

          <div className="form-group">
            <label>PAN Number<span className="required">*</span></label>
            <input type="text" name="pan" value={formData.pan} onChange={handleChange} disabled={viewMode} />
            {renderError("pan")}
          </div>

          <div className="form-group">
            <label>Department<span className="required">*</span></label>
            <select name="department" value={formData.department} onChange={handleChange} disabled={viewMode}>
              <option value="">Select</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
            {renderError("department")}
          </div>

          <div className="form-group">
            <label>Designation<span className="required">*</span></label>
            <select name="designation" value={formData.designation} onChange={handleChange} disabled={viewMode}>
              <option value="">Select</option>
              <option value="Junior Developer">Junior Developer</option>
              <option value="Senior Developer">Senior Developer</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Manager">Manager</option>
              <option value="HR Executive">HR Executive</option>
            </select>
            {renderError("designation")}
          </div>

          <div className="form-group">
            <label>Date of Joining<span className="required">*</span></label>
            <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} disabled={viewMode} />
            {renderError("joiningDate")}
          </div>

          <div className="form-group">
            <label>Experience (Years)<span className="required">*</span></label>
            <select name="workExperience" value={formData.workExperience} onChange={handleChange} disabled={viewMode}>
              <option value="">Select</option>
              {[...Array(21).keys()].map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
            {renderError("workExperience")}
          </div>

          <div className="form-group">
            <label>Blood Group<span className="required">*</span></label>
            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} disabled={viewMode}>
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            {renderError("bloodGroup")}
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3>Address Information</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Flat / House No <span className="required">*</span></label>
            <input type="text" name="houseNo" value={formData.houseNo} onChange={handleChange} disabled={viewMode} />
            {renderError("houseNo")}
          </div>

          <div className="form-group">
            <label>Street / Area<span className="required">*</span></label>
            <input type="text" name="street" value={formData.street} onChange={handleChange} disabled={viewMode} />
            {renderError("street")}
          </div>

          <div className="form-group">
            <label>City / Village<span className="required">*</span></label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} disabled={viewMode} />
            {renderError("city")}
          </div>

          <div className="form-group">
            <label>District<span className="required">*</span></label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} disabled={viewMode} />
            {renderError("district")}
          </div>

          <div className="form-group">
            <label>State<span className="required">*</span></label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} disabled={viewMode} />
            {renderError("state")}
          </div>

          <div className="form-group">
            <label>Country<span className="required">*</span></label>
            <input type="text" name="country" value={formData.country} onChange={handleChange} disabled={viewMode} />
            {renderError("country")}
          </div>

          <div className="form-group">
            <label>Pincode<span className="required">*</span></label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} disabled={viewMode} />
            {renderError("pincode")}
          </div>
        </div>

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
            <button className="btn success" onClick={handleSave}>
              Save & Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonalInfo;
