import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import api from "../../api/axiosInstance";
import { API_ENDPOINTS } from "../../api/endpoints";

const BankInfo = forwardRef(({ onNext, onBack, employeeId, viewMode, data }, ref) => {
  const [bankName, setBankName] = useState("");
  const [manualBank, setManualBank] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [branch, setBranch] = useState("");
  const [uan, setUan] = useState("");
  const [pf, setPf] = useState("");
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!data) return;

    setCustomerId(data.customer_Id || "");
    setBankName(data.bank_Name || "");
    setManualBank("");
    setAccountHolder(data.account_Holder_Name || "");
    setAccountNumber(data.account_Number || "");
    setIfsc(data.ifsC_Code || "");
    setBranch(data.branch_Name || "");
    setUan(data.uaN_Number || "");
    setPf(data.pF_Account_Number || "");
  }, [data]);

  useImperativeHandle(ref, () => ({
    validate() {
      return true;
    },
  }));

  const validateFields = () => {
    let newErrors = {};

    if (!customerId.trim()) newErrors.customerId = "Customer ID is required";
    if (!bankName) newErrors.bankName = "Bank Name is required";
    if (bankName === "Other" && !manualBank.trim())
      newErrors.manualBank = "Please enter bank name";

    if (!accountHolder.trim()) {
      newErrors.accountHolder = "Account Holder Name is required";
    } else if (!/^[A-Za-z ]{1,40}$/.test(accountHolder)) {
      newErrors.accountHolder = "Only letters (max 40)";
    }

    if (!accountNumber) {
      newErrors.accountNumber = "Account Number is required";
    } else if (!/^[0-9]{9,18}$/.test(accountNumber)) {
      newErrors.accountNumber = "9–18 digits only";
    }

    if (!ifsc) {
      newErrors.ifsc = "IFSC Code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      newErrors.ifsc = "Invalid IFSC";
    }

    if (!branch.trim()) newErrors.branch = "Branch Name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNext = async () => {
    if (!validateFields()) return;

    const finalBankName = bankName === "Other" ? manualBank : bankName;

    try {
      const payload = {
        employee_Id: employeeId,
        customer_Id: customerId,
        bank_Name: finalBankName,
        account_Holder_Name: accountHolder,
        account_Number: accountNumber,
        ifsC_Code: ifsc,
        branch_Name: branch,
        uaN_Number: uan,
        pF_Account_Number: pf,
      };

      let response;

      if (data) {
        // ✅ EDIT
        response = await api.put(
          API_ENDPOINTS.employeeBankDetails.byEmployeeId(employeeId),
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // ✅ CREATE
        response = await api.post(
          API_ENDPOINTS.employeeBankDetails.list,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      setSuccessMsg(data ? "Bank details updated!" : "Bank details saved!");

      setTimeout(() => {
        onNext();
      }, 800);
    } catch (error) {
      console.error("Bank API Error:", error.response?.data || error.message);
      // alert(error.response?.data?.message || "Failed to save bank details");
    }
  };

  const sectionStyle = {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    border: "1px solid #eee",
    margin: "15px",
  };

  const cardStyle = {
    background: "#fafafa",
    padding: "20px",
    borderRadius: "12px",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    marginTop: "20px",
  };

  const groupStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    fontSize: "13px",
    marginBottom: "6px",
    color: "#555",
  };

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "#f5f7fa",
    fontSize: "14px",
    outline: "none",
  };

  const btnContainer = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  };

  const backBtn = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#e5e7eb",
    cursor: "pointer",
  };

  const saveNextBtn = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#10b981",
    color: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={sectionStyle}>
      <h3>Bank Information</h3>

      <div style={cardStyle}>
        <div style={gridStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Customer ID <span style={{ color: "red" }}>*</span></label>
            <input
              style={inputStyle}
              value={customerId || ""}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setErrors((prev) => ({ ...prev, customerId: "" }));
              }}
              disabled={viewMode}
            />
            {errors.customerId && <span style={{ color: "red", fontSize: "12px" }}>{errors.customerId}</span>}
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Bank Name <span style={{ color: "red" }}>*</span></label>
            <select
              style={inputStyle}
              value={bankName || ""}
              onChange={(e) => {
                setBankName(e.target.value);
                setErrors((prev) => ({ ...prev, bankName: "", manualBank: "" }));
              }}
              disabled={viewMode}
            >
              <option value="">Select Bank</option>
              <option>State Bank of India</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
              <option>IDFC First Bank</option>
              <option>Canara Bank</option>
              <option>Federal Bank</option>
              <option>Union Bank</option>
              <option value="Other">Others</option>
            </select>
            {errors.bankName && <span style={{ color: "red", fontSize: "12px" }}>{errors.bankName}</span>}
          </div>

          {bankName === "Other" && (
            <div style={groupStyle}>
              <label style={labelStyle}>Enter Bank Name <span style={{ color: "red" }}>*</span></label>
              <input
                style={inputStyle}
                value={manualBank || ""}
                onChange={(e) => {
                  setManualBank(e.target.value);
                  setErrors((prev) => ({ ...prev, manualBank: "" }));
                }}
                disabled={viewMode}
              />
              {errors.manualBank && <span style={{ color: "red", fontSize: "12px" }}>{errors.manualBank}</span>}
            </div>
          )}

          <div style={groupStyle}>
            <label style={labelStyle}>Account Holder Name <span style={{ color: "red" }}>*</span></label>
            <input
              style={inputStyle}
              value={accountHolder || ""}
              onChange={(e) => {
                setAccountHolder(e.target.value);
                setErrors((prev) => ({ ...prev, accountHolder: "" }));
              }}
              disabled={viewMode}
            />
            {errors.accountHolder && <span style={{ color: "red", fontSize: "12px" }}>{errors.accountHolder}</span>}
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Account Number <span style={{ color: "red" }}>*</span></label>
            <input
              style={inputStyle}
              value={accountNumber || ""}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setErrors((prev) => ({ ...prev, accountNumber: "" }));
              }}
              disabled={viewMode}
            />
            {errors.accountNumber && <span style={{ color: "red", fontSize: "12px" }}>{errors.accountNumber}</span>}
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>IFSC Code <span style={{ color: "red" }}>*</span></label>
            <input
              style={inputStyle}
              value={ifsc || ""}
              onChange={(e) => {
                setIfsc(e.target.value.toUpperCase());
                setErrors((prev) => ({ ...prev, ifsc: "" }));
              }}
              disabled={viewMode}
            />
            {errors.ifsc && <span style={{ color: "red", fontSize: "12px" }}>{errors.ifsc}</span>}
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Branch Name <span style={{ color: "red" }}>*</span></label>
            <input
              style={inputStyle}
              value={branch || ""}
              onChange={(e) => {
                setBranch(e.target.value);
                setErrors((prev) => ({ ...prev, branch: "" }));
              }}
              disabled={viewMode}
            />
            {errors.branch && <span style={{ color: "red", fontSize: "12px" }}>{errors.branch}</span>}
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>UAN Number </label>
            <input
              style={inputStyle}
              value={uan || ""}
              onChange={(e) => {
                setUan(e.target.value);
                setErrors((prev) => ({ ...prev, uan: "" }));
              }}
              disabled={viewMode}
            />
            {errors.uan && <span style={{ color: "red", fontSize: "12px" }}>{errors.uan}</span>}
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>PF Account Number </label>
            <input
              style={inputStyle}
              value={pf || ""}
              onChange={(e) => {
                setPf(e.target.value);
                setErrors((prev) => ({ ...prev, pf: "" }));
              }}
              disabled={viewMode}
            />
            {errors.pf && <span style={{ color: "red", fontSize: "12px" }}>{errors.pf}</span>}
          </div>
        </div>
      </div>

      <div style={btnContainer}>

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
              width: "40%",
            }}
          >
            {successMsg}
          </p>
        )}

        {!viewMode && (
          <button style={backBtn} onClick={onBack}>
            Back
          </button>
        )}

        {!viewMode && (
          <button style={saveNextBtn} onClick={handleSaveNext}>
            Save & Next
          </button>
        )}
      </div>
    </div>
  );
});

export default BankInfo;
