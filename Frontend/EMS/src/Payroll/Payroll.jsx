import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./Payroll.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS, buildApiUrl } from "../api/endpoints";
import {
  FaDownload,
  FaEye,
  FaAngleLeft,
  FaAngleRight,
  FaAnglesLeft,
  FaAnglesRight
} from "react-icons/fa6";

function Payroll() {
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString("en-US", { month: "long" });
  const currentYearValue = currentDate.getFullYear();

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // =========================
  // ALL PAYSLIPS (FETCH ONCE)
  // =========================
  const [allPayslips, setAllPayslips] = useState([]);

  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [year, setYear] = useState(currentYearValue);
  const [month, setMonth] = useState(currentMonthName);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [generating, setGenerating] = useState(false);

  const [generationMode, setGenerationMode] = useState("auto");
  const [deduction, setDeduction] = useState("");

  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // =========================
  // DEFAULT FILTER = CURRENT MONTH + CURRENT YEAR
  // =========================
  const [recentFilterMonth, setRecentFilterMonth] = useState("All");
  const [recentFilterYear, setRecentFilterYear] = useState("All");

  // =========================
  // FRONTEND PAGINATION STATES
  // =========================
  const [recentPage, setRecentPage] = useState(1);
  const [recentRowsPerPage, setRecentRowsPerPage] = useState(10);
  const [recentLoading, setRecentLoading] = useState(false);

  const token = localStorage.getItem("token");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 10 }, (_, i) => 2022 + i);

  const [manualForm, setManualForm] = useState({
    totalWorkingDays: "",
    lopDays: "",
    otherDeductions: ""
  });

  useEffect(() => {
    fetchEmployees();
    fetchRecentPayslips();
  }, []);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Reset page when filter / rows changes
  useEffect(() => {
    setRecentPage(1);
  }, [recentFilterMonth, recentFilterYear, recentRowsPerPage]);

  // =========================
  // SAFE DATE PARSER
  // =========================
  const parseDateSafely = (dateString) => {
    if (!dateString) return null;

    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }

    const raw = String(dateString).trim();

    const match = raw.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hour = parseInt(match[4] || "0", 10);
      const minute = parseInt(match[5] || "0", 10);
      const second = parseInt(match[6] || "0", 10);

      const parsed = new Date(year, month, day, hour, minute, second);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    const fallback = new Date(raw);
    return !isNaN(fallback.getTime()) ? fallback : null;
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.payroll.employees, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const empData = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setEmployees(empData);

      if (empData.length > 0) {
        setSelectedEmp(empData[0]);
      }
    } catch (err) {
      console.error("❌ Employees fetch error:", err.response?.data || err.message);
      setErrorMsg("Failed to fetch employees");
    }
  };

  // =========================
  // FETCH ALL PAYSLIPS (NO BACKEND FILTER / PAGINATION)
  // =========================
  const fetchRecentPayslips = useCallback(async () => {
    try {
      setRecentLoading(true);

      const res = await api.get(API_ENDPOINTS.payroll.recent, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const responseData = res.data;

      const payslipData =
        responseData?.data ||
        responseData?.items ||
        responseData?.records ||
        (Array.isArray(responseData) ? responseData : []);

      const normalized = payslipData
        .map((p) => {
          const generatedDate =
            p.generated_On ||
            p.generatedOn ||
            p.generatedDate ||
            p.createdOn ||
            p.createdDate ||
            p.generatedAt ||
            p.createdAt;

          const parsedDate = parseDateSafely(generatedDate);

          const normalizedMonth =
            p.month && months.includes(p.month)
              ? p.month
              : parsedDate
                ? months[parsedDate.getMonth()]
                : "";

          const normalizedYear =
            p.year && !isNaN(Number(p.year))
              ? Number(p.year)
              : parsedDate
                ? parsedDate.getFullYear()
                : "";

          return {
            ...p,
            netPay:
              p.netPay ||
              p.netSalary ||
              p.totalNet ||
              (p.ctc ? p.ctc / 12 : 0),
            generatedDate,
            parsedGeneratedDate: parsedDate,
            month: normalizedMonth,
            year: normalizedYear,
            OtherDeductions:
              p.OtherDeductions ?? p.otherDeductions ?? p.deduction ?? 0
          };
        })
        .sort((a, b) => {
          const dateA = a.parsedGeneratedDate ? a.parsedGeneratedDate.getTime() : 0;
          const dateB = b.parsedGeneratedDate ? b.parsedGeneratedDate.getTime() : 0;
          return dateB - dateA;
        });

      setAllPayslips(normalized);
    } catch (err) {
      console.error("❌ Recent payslips fetch error:", err.response?.data || err.message);
      setErrorMsg("Failed to fetch recent payslips");
      setAllPayslips([]);
    } finally {
      setRecentLoading(false);
    }
  }, [token]);

  const getMonthYearList = (count, selectedMonth, selectedYear) => {
    const selectedMonthIndex = months.findIndex((m) => m === selectedMonth);
    const result = [];

    for (let i = 0; i < count; i++) {
      let monthIndex = selectedMonthIndex - i;
      let currentYear = Number(selectedYear);

      while (monthIndex < 0) {
        monthIndex += 12;
        currentYear -= 1;
      }

      result.push({
        month: months[monthIndex],
        year: currentYear
      });
    }

    return result;
  };

  // =========================
  // FILTERED EMPLOYEES
  // =========================
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const keyword = search.toLowerCase();
      return (
        (emp.name || "").toLowerCase().includes(keyword) ||
        (emp.employee_Id || "").toLowerCase().includes(keyword)
      );
    });
  }, [employees, search]);

  const selectedEmployeeObjects = useMemo(() => {
    return employees.filter((emp) => selectedEmployees.includes(emp.employee_Id));
  }, [employees, selectedEmployees]);

  // =========================
  // FRONTEND FILTERING
  // =========================
  const filteredPayslips = useMemo(() => {
    return allPayslips.filter((p) => {
      const monthMatch =
        recentFilterMonth === "All" || p.month === recentFilterMonth;

      const yearMatch =
        recentFilterYear === "All" || String(p.year) === String(recentFilterYear);

      return monthMatch && yearMatch;
    });
  }, [allPayslips, recentFilterMonth, recentFilterYear]);

  // =========================
  // FRONTEND PAGINATION
  // =========================
  const recentTotalCount = filteredPayslips.length;
  const totalRecentPages = Math.max(1, Math.ceil(recentTotalCount / recentRowsPerPage));

  const paginatedRecentPayslips = useMemo(() => {
    const startIndex = (recentPage - 1) * recentRowsPerPage;
    const endIndex = startIndex + recentRowsPerPage;
    return filteredPayslips.slice(startIndex, endIndex);
  }, [filteredPayslips, recentPage, recentRowsPerPage]);

  useEffect(() => {
    if (recentPage > totalRecentPages) {
      setRecentPage(totalRecentPages);
    }
  }, [recentPage, totalRecentPages]);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, recentPage - 2);
    let end = Math.min(totalRecentPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // =========================
  // MULTI SELECT LOGIC
  // =========================
  const handleToggleEmployee = (employeeId) => {
    if (generating) return;

    setSelectedEmployees((prev) => {
      const alreadySelected = prev.includes(employeeId);
      let updated;

      if (alreadySelected) {
        updated = prev.filter((id) => id !== employeeId);
      } else {
        updated = [...prev, employeeId];
      }

      if (updated.length === 1) {
        const onlyEmp = employees.find((e) => e.employee_Id === updated[0]);
        setSelectedEmp(onlyEmp || null);
      } else {
        setSelectedEmp(null);
      }

      return updated;
    });
  };

  const handleSelectAll = () => {
    if (generating) return;

    const visibleIds = filteredEmployees.map((emp) => emp.employee_Id);

    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedEmployees.includes(id));

    if (allVisibleSelected) {
      const updated = selectedEmployees.filter((id) => !visibleIds.includes(id));
      setSelectedEmployees(updated);

      if (updated.length === 1) {
        const onlyEmp = employees.find((e) => e.employee_Id === updated[0]);
        setSelectedEmp(onlyEmp || null);
      } else {
        setSelectedEmp(null);
      }
    } else {
      const updated = [...new Set([...selectedEmployees, ...visibleIds])];
      setSelectedEmployees(updated);

      if (updated.length === 1) {
        const onlyEmp = employees.find((e) => e.employee_Id === updated[0]);
        setSelectedEmp(onlyEmp || null);
      } else {
        setSelectedEmp(null);
      }
    }
  };

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployees.includes(emp.employee_Id));

  const handleCardClick = (emp) => {
    if (generating) return;
    setSelectedEmp(emp);
  };

  // =========================
  // GENERATE PAYSLIP
  // =========================
  const handleGeneratePayslip = async () => {
    if (generating) return;

    const employeeIds =
      selectedEmployees.length > 0
        ? selectedEmployees
        : selectedEmp
          ? [selectedEmp.employee_Id]
          : [];

    if (employeeIds.length === 0) {
      setErrorMsg("Please select employee(s)");
      return;
    }

    try {
      setGenerating(true);
      setSuccessMsg("");
      setErrorMsg("");

      if (generationMode === "auto") {
        const periods =
          selectedPeriod === 1
            ? [{ month, year }]
            : getMonthYearList(selectedPeriod, month, year);
        const deductionValue = Number(deduction) || 0;

        for (const employeeId of employeeIds) {
          for (const period of periods) {
            await api.post(API_ENDPOINTS.payroll.generate, null, {
              params: {
                employeeId,
                year: period.year,
                month: period.month,
                OtherDeductions: deductionValue
              },
              headers: {
                Authorization: `Bearer ${token}`,
              }
            });
          }
        }

        setSuccessMsg(
          `Payslips generated for ${employeeIds.length} employee(s) for ${selectedPeriod} month(s)`
        );
      } else {
        for (const employeeId of employeeIds) {
          const payload = {
            employeeId,
            month,
            year: Number(year),
            totalWorkingDays: Number(manualForm.totalWorkingDays) || 0,
            lopDays: Number(manualForm.lopDays) || 0,
            otherDeductions: Number(manualForm.otherDeductions) || 0
          };

          await api.post(API_ENDPOINTS.payroll.manualGenerate, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          });
        }

        setSuccessMsg(`Manual payslips generated for ${employeeIds.length} employee(s)`);

        setManualForm({
          totalWorkingDays: "",
          lopDays: "",
          otherDeductions: ""
        });
      }

      setRecentPage(1);
      await fetchRecentPayslips();
    } catch (err) {
      console.error("❌ Generate Error:", err.response?.data || err.message);
      setErrorMsg(err.response?.data?.message || "Failed to generate payslip(s)");
    } finally {
      setGenerating(false);
    }
  };

  const handleManualInputChange = (e) => {
    if (generating) return;

    const { name, value } = e.target;
    setManualForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewPayslip = (id) => {
    window.open(buildApiUrl(API_ENDPOINTS.payroll.preview(id)), "_blank");
  };

  const handleDownloadPayslip = (id) => {
    window.open(buildApiUrl(API_ENDPOINTS.payroll.download(id)), "_blank");
  };

  const isBulkMode = selectedEmployees.length > 1;

  const previewEmployee =
    selectedEmployees.length === 1
      ? selectedEmployeeObjects[0]
      : selectedEmp;

  return (
    <div className="payroll-page">
      {/* LEFT PANEL */}
      <div className={`employee-panel ${generating ? "panel-disabled" : ""}`}>
        <div className="payroll-header">
          <h2>Payroll</h2>
        </div>
        <input
          className="search-box"
          placeholder="Search ID or Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={generating}
        />

        <div className="select-all-row">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={handleSelectAll}
              disabled={generating}
            />
            <span>
              Select All
              {filteredEmployees.length > 0 ? ` (${filteredEmployees.length})` : ""}
            </span>
          </label>
        </div>

        <div className="employee-list">
          {filteredEmployees.map((emp) => {
            const isChecked = selectedEmployees.includes(emp.employee_Id);
            const isActive =
              selectedEmp?.employee_Id === emp.employee_Id ||
              (selectedEmployees.length === 1 && isChecked);

            return (
              <div
                key={emp.employee_Id}
                className={`employee-card ${isActive ? "active" : ""} ${generating ? "disabled-card" : ""
                  }`}
                onClick={() => handleCardClick(emp)}
              >
                <div className="employee-left">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={generating}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleEmployee(emp.employee_Id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div>
                    <strong>{emp.name}</strong>
                    <p>{emp.employee_Id}</p>
                  </div>
                </div>

                <span className="dept">{emp.department}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      {(selectedEmp || selectedEmployees.length > 0) && (
        <div className="payroll-content">
          {generating && (
            <div className="generation-overlay">
              <div className="generation-loader"></div>
              <p>Generating payslip(s)... Please wait</p>
            </div>
          )}

          <div className={`employee-header ${generating ? "panel-disabled" : ""}`}>
            {!isBulkMode ? (
              <>
                <div className="avatar">
                  {previewEmployee?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>

                <div className="employee-header-info">
                  <h3>{previewEmployee?.name || "Employee"}</h3>
                  <p>
                    {previewEmployee?.employee_Id || "-"} •{" "}
                    {previewEmployee?.department || "-"} • CTC ₹
                    {previewEmployee?.ctc
                      ? Number(previewEmployee.ctc).toLocaleString("en-IN")
                      : "-"}{" "}
                    • Joined{" "}
                    {previewEmployee?.joiningDate
                      ? new Date(previewEmployee.joiningDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric"
                      })
                      : "-"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="avatar bulk-avatar">{selectedEmployees.length}</div>

                <div className="employee-header-info">
                  <h3>{selectedEmployees.length} Employees Selected</h3>
                  <p>
                    Bulk generation mode •{" "}
                    {selectedEmployeeObjects
                      .slice(0, 3)
                      .map((e) => e.name)
                      .join(", ")}
                    {selectedEmployeeObjects.length > 3
                      ? ` +${selectedEmployeeObjects.length - 3} more`
                      : ""}
                  </p>
                </div>
              </>
            )}

            <div className="mode-dropdown-wrapper">
              <label>Payslip Mode</label>
              <select
                value={generationMode}
                onChange={(e) => setGenerationMode(e.target.value)}
                className="mode-dropdown"
                disabled={generating}
              >
                <option value="auto">Auto Payslip</option>
                <option value="manual">Manual Payslip</option>
              </select>
            </div>
          </div>

          {(successMsg || errorMsg) && (
            <div className={errorMsg ? "error-message" : "success-message"}>
              {successMsg || errorMsg}
            </div>
          )}

          {/* AUTO MODE */}
          {generationMode === "auto" && (
            <>
              <div className="ctc-card">
                <label>DEDUCTION (₹)</label>

                <input
                  type="number"
                  min="0"
                  value={deduction}
                  onChange={(e) => setDeduction(e.target.value)}
                  placeholder="Enter Deduction"
                  disabled={generating}
                />

                <small className="helper-text">
                  Current Deduction: ₹{Number(deduction) || 0}
                </small>
              </div>

              <div className="generate-card">
                <h4>
                  Generate Payslip
                  <span className="selected-badge">
                    {selectedEmployees.length > 0
                      ? `${selectedEmployees.length} Selected`
                      : "Single Employee"}
                  </span>
                </h4>

                <div className="period-section">
                  <div className="standard-periods">
                    <label>STANDARD PERIODS</label>

                    <div className="period-buttons">
                      {[1, 3, 6, 12].map((period) => (
                        <button
                          key={period}
                          type="button"
                          disabled={generating}
                          className={selectedPeriod === period ? "active-period-btn" : ""}
                          onClick={() => setSelectedPeriod(period)}
                        >
                          {period}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="specific-period">
                    <label>SPECIFIC PERIOD</label>

                    <div className="period-buttons">
                      <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        disabled={generating}
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>

                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        disabled={generating}
                      >

                        {months.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  className="generate-btn"
                  onClick={handleGeneratePayslip}
                  disabled={generating}
                >
                  {generating
                    ? "Generating..."
                    : selectedEmployees.length > 0
                      ? `Generate for ${selectedEmployees.length} Employee(s) - ${selectedPeriod} Month(s)`
                      : `Generate ${selectedPeriod > 1
                        ? `${selectedPeriod} Months from ${month} ${year}`
                        : `${month} ${year} Payslip`}}`}
                </button>
              </div>
            </>
          )}

          {/* MANUAL MODE */}
          {generationMode === "manual" && (
            <div className="generate-card">
              <h4>
                Manual Payslip Generation
                <span className="selected-badge">
                  {selectedEmployees.length > 0
                    ? `${selectedEmployees.length} Selected`
                    : "Single Employee"}
                </span>
              </h4>
              <div className="period-section manual-top-controls">
                <div className="specific-period">
                  <label>MONTH</label>
                  <div className="period-buttons">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      disabled={generating}
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="specific-period">
                  <label>YEAR</label>
                  <div className="period-buttons">
                    <select
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      disabled={generating}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="manual-fields-grid">
                {[
                  ["totalWorkingDays", "Total Working Days"],
                  ["lopDays", "LOP Days"],
                  ["otherDeductions", "Other Deductions"]
                ].map(([name, label]) => (
                  <div key={name} className="manual-field">
                    <label>{label}</label>
                    <input
                      type="number"
                      min="0"
                      name={name}
                      value={manualForm[name]}
                      onChange={handleManualInputChange}
                      placeholder={`Enter ${label}`}
                      disabled={generating}
                    />
                  </div>
                ))}
              </div>

              <button
                className="generate-btn"
                onClick={handleGeneratePayslip}
                disabled={generating}
                style={{ marginTop: "20px" }}
              >
                {generating
                  ? "Generating..."
                  : selectedEmployees.length > 0
                    ? `Generate Manual for ${selectedEmployees.length} Employee(s)`
                    : "Generate Manual Payslip"}
              </button>
            </div>
          )}

          {/* RECENT PAYSLIPS */}
          <div className="recent-table">
            <div className="recent-table-header">
              <h4>Recently Generated</h4>

              <div className="recent-filters">
                <select
                  value={recentFilterMonth}
                  onChange={(e) => setRecentFilterMonth(e.target.value)}
                  disabled={generating || recentLoading}
                >
                  <option value="All">All Months</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={recentFilterYear}
                  onChange={(e) => setRecentFilterYear(e.target.value)}
                  disabled={generating || recentLoading}
                >
                  <option value="All">All Years</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>

                <select
                  value={recentRowsPerPage}
                  onChange={(e) => setRecentRowsPerPage(Number(e.target.value))}
                  disabled={generating || recentLoading}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Period</th>
                    <th>Net Pay</th>
                    <th>Deduction</th>
                    <th>CTC</th>
                    <th>Generated</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {recentLoading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                        Loading payslips...
                      </td>
                    </tr>
                  ) : paginatedRecentPayslips.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        No Payslips Generated
                      </td>
                    </tr>
                  ) : (
                    paginatedRecentPayslips.map((p, index) => {
                      const emp = employees.find((e) => e.employee_Id === p.employeeId);

                      return (
                        <tr key={p.id || index}>
                          <td>
                            <div className="emp-name">
                              {emp?.name || p.employeeName || p.employeeId}
                            </div>
                            <div className="empid">{p.employeeId}</div>
                          </td>

                          <td>{emp?.department || p.department || "-"}</td>

                          <td>
                            {p.month || "-"} {p.year || ""}
                          </td>

                          <td>
                            ₹
                            {p.netPay
                              ? Number(p.netPay).toLocaleString("en-IN")
                              : "-"}
                          </td>

                          <td>
                            ₹
                            {Number(
                              p.OtherDeductions ??
                              p.otherDeductions ??
                              p.deduction ??
                              0
                            ).toLocaleString("en-IN")}
                          </td>

                          <td>
                            ₹
                            {p.ctc
                              ? Number(p.ctc).toLocaleString("en-IN")
                              : "-"}
                          </td>

                          <td>
                            {p.parsedGeneratedDate
                              ? p.parsedGeneratedDate.toLocaleString("en-IN", {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true
                              })
                              : "-"}
                          </td>

                          <td>
                            <div className="action-icons">
                              <FaEye
                                className="view-icon"
                                onClick={() => handleViewPayslip(p.id)}
                              />

                              <FaDownload
                                className="download-icon"
                                onClick={() => handleDownloadPayslip(p.id)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {recentTotalCount > 0 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  Showing{" "}
                  <strong>{(recentPage - 1) * recentRowsPerPage + 1}</strong> to{" "}
                  <strong>
                    {Math.min(recentPage * recentRowsPerPage, recentTotalCount)}
                  </strong>{" "}
                  of <strong>{recentTotalCount}</strong>
                </div>

                <div className="pagination-controls">
                  <button
                    onClick={() => setRecentPage(1)}
                    disabled={recentPage === 1}
                  >
                    <FaAnglesLeft />
                  </button>

                  <button
                    onClick={() => setRecentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={recentPage === 1}
                  >
                    <FaAngleLeft />
                  </button>

                  {getVisiblePages().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={recentPage === pageNum ? "active-page-btn" : ""}
                      onClick={() => setRecentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setRecentPage((prev) => Math.min(prev + 1, totalRecentPages))
                    }
                    disabled={recentPage === totalRecentPages || totalRecentPages === 0}
                  >
                    <FaAngleRight />
                  </button>

                  <button
                    onClick={() => setRecentPage(totalRecentPages)}
                    disabled={recentPage === totalRecentPages || totalRecentPages === 0}
                  >
                    <FaAnglesRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Payroll;
