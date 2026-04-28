import React, { useEffect, useState } from "react";
import {
  FaDownload,
  FaEye,
  FaWallet,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaFilePdf,
  FaReceipt,
} from "react-icons/fa";
import "./UserPayslip.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function UserPayslip() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      console.log("🔑 Token:", token);

      const res = await api.get(API_ENDPOINTS.payroll.myPayslips, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;

      console.log("✅ Payslip API Response:", data);

      setPayslips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("❌ Fetch Error:", err);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatMonth = (monthValue) => {
    if (!monthValue) return "Month";
    return monthValue;
  };

  if (loading) return <p className="loading-text">Loading payslips...</p>;

  const current = payslips?.[0];

  const gross = current?.grossSalary ?? current?.ctc ?? 0;
  const deductions = current?.totalDeductions ?? 0;
  const net = current?.netSalary ?? gross - deductions;

  return (
    <div className="payslip-container">
      <div className="payslip-header">
        <div>
          <h1 className="main-title">My Payslips</h1>
          <p className="subtitle">Track your salary, deductions and downloads</p>
        </div>

        <div className="header-badge">
          <FaReceipt />
          <span>{payslips.length} Records</span>
        </div>
      </div>

      {/* CURRENT PAYSLIP */}
      {current && (
        <div className="payslip-card current-card">
          <div className="card-top">
            <div className="section-title-wrap">
              <div className="section-icon">
                <FaWallet />
              </div>
              <h2>Current Payslip</h2>
            </div>

            <div className="month-badge">
              <FaCalendarAlt />
              <span>{formatMonth(current.month || "Current Month")}</span>
            </div>
          </div>

          <div className="salary-cards">
            <div className="salary-box gross-box">
              <div className="salary-icon gross-icon">
                <FaMoneyBillWave />
              </div>
              <p>Gross Salary</p>
              <h3>{formatCurrency(gross)}</h3>
            </div>

            <div className="salary-box deduction-box">
              <div className="salary-icon deduction-icon">
                <FaFileInvoiceDollar />
              </div>
              <p>Deductions</p>
              <h3 className="deduction">{formatCurrency(deductions)}</h3>
            </div>

            <div className="salary-box net-box">
              <div className="salary-icon net-icon">
                <FaWallet />
              </div>
              <p>Net Pay</p>
              <h3 className="net">{formatCurrency(net)}</h3>
            </div>
          </div>

          <div className="action-buttons">
            {current.previewUrl && (
              <button
                className="view-btn"
                onClick={() => window.open(current.previewUrl, "_blank")}
              >
                <FaEye /> View Payslip
              </button>
            )}

            {current.downloadUrl && (
              <button
                className="download-btn"
                onClick={() => window.open(current.downloadUrl, "_blank")}
              >
                <FaFilePdf /> Download PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAST PAYSLIPS */}
      <div className="payslip-card">
        <div className="past-header">
          <div className="section-title-wrap">
            <div className="section-icon secondary">
              <FaReceipt />
            </div>
            <h2>Past Payslips</h2>
          </div>
        </div>

        {payslips.length > 1 ? (
          payslips.slice(1).map((p, i) => {
            const grossPast = p?.grossSalary ?? p?.ctc ?? 0;
            const deductionsPast = p?.totalDeductions ?? 0;
            const netPast = p?.netSalary ?? grossPast - deductionsPast;

            return (
              <div className="past-item" key={i}>
                <div className="past-left">
                  <div className="past-month-icon">
                    <FaCalendarAlt />
                  </div>

                  <div>
                    <h4>{formatMonth(p.month)}</h4>
                    <p>Net Salary: {formatCurrency(netPast)}</p>
                  </div>
                </div>

                <div className="icons">
                  {p.previewUrl && (
                    <button
                      className="icon-btn view-icon-btn"
                      onClick={() => window.open(p.previewUrl, "_blank")}
                      title="View Payslip"
                    >
                      <FaEye />
                    </button>
                  )}

                  {p.downloadUrl && (
                    <button
                      className="icon-btn download-icon-btn"
                      onClick={() => window.open(p.downloadUrl, "_blank")}
                      title="Download Payslip"
                    >
                      <FaDownload />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <FaReceipt className="empty-icon" />
            <p>No past payslips found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPayslip;
