import React, { useEffect, useState } from "react";
import "./Reports.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  FaUsers,
  FaBuilding,
  FaCalendarAlt,
  FaTasks,
  FaRupeeSign,
  FaProjectDiagram,
  FaPlaneDeparture,
  FaUserCheck,
  FaUserTimes
} from "react-icons/fa";

function Reports() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(API_ENDPOINTS.reports.all, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Reports API response:", response.data);

      const data = response.data;

      const cards = [
        {
          icon: <FaUsers />,
          title: "Employee List",
          desc: "Total number of employees",
          meta: `${data.totalEmployees ?? 0} records`,
          path: "/employees",
        },
        {
          icon: <FaBuilding />,
          title: "Department List",
          desc: "Total number of departments",
          meta: `${data.totalDepartments ?? 0} records`,
          path: "/departments",
        },
        {
          icon: <FaUserCheck />,
          title: "Present Today",
          desc: "Employees marked present today",
          meta: `${data.presentToday ?? 0} employees`,
          path: "/attendance",
          filter: "Present",
        },
        {
          icon: <FaUserTimes />,
          title: "Absent Today",
          desc: "Employees marked absent today",
          meta: `${data.absentToday ?? 0} employees`,
          path: "/attendance",
          filter: "Absent",
        },
        {
          icon: <FaTasks />,
          title: "Task Report",
          desc: "Total active and tracked tasks",
          meta: `${data.totalTasks ?? 0} tasks`,
          path: "/tasks",
        },
        {
          icon: <FaPlaneDeparture />,
          title: "Leave Report",
          desc: "Total employee leave records",
          meta: `${data.totalLeaves ?? 0} leaves`,
          path: "/leave-management",
        },
        {
          icon: <FaProjectDiagram />,
          title: "Project Report",
          desc: "Total projects in the system",
          meta: `${data.totalProjects ?? 0} projects`,
          path: "/projects",
        },
        {
          icon: <FaRupeeSign />,
          title: "Salary Report",
          desc: "Total salary paid for the current month",
          meta: `₹${Number(data.totalSalaryPaid ?? 0).toLocaleString("en-IN")}`,
          path: "/payroll",
        },
        {
          icon: <FaCalendarAlt />,
          title: "Current Month",
          desc: "Current reporting month",
          meta: data.currentMonth || "N/A",
          // path: "/holidays",
        },
      ];

      setReportCards(cards);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report) => {
    if (report.path) {
      navigate(report.path, {
        state: { filter: report.filter }
      });
    }
  };

  if (loading) {
    return <div className="reports-container">Loading reports...</div>;
  }

  if (error) {
    return <div className="reports-container error-text">{error}</div>;
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
        <p>Generate and view reports</p>
      </div>

      <div className="reports-grid">
        {reportCards.map((report, index) => (
          <div
            key={index}
            className="report-card"
            onClick={() => handleReportClick(report)}
          >
            <div className="report-icon">{report.icon}</div>
            <h3>{report.title}</h3>
            <p>{report.desc}</p>
            <div className="report-meta">{report.meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reports;
