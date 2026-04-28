import React, { useEffect, useState, useRef } from "react";
import {
  FaUsers,
  FaBuilding,
  FaProjectDiagram,
  FaCalendarCheck,
} from "react-icons/fa";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function TopCharts() {

  const [data, setData] = useState({});
  const fetched = useRef(false);

  const getToken = () => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    console.log("🔑 Token:", token); // ✅ Added
    return token;
  };

  useEffect(() => {

    if (fetched.current) {
      console.log("⚠️ Already fetched, skipping...");
      return;
    }

    fetched.current = true;

    console.log("🚀 Fetching Dashboard Data..."); // ✅ Added

    fetchDashboard();

  }, []);

  const fetchDashboard = async () => {
    try {

      const token = getToken();

      console.log("📡 API URL:", API_ENDPOINTS.dashboard); // ✅ Added

      const res = await api.get(API_ENDPOINTS.dashboard, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Full API Response:", res); // ✅ Added
      console.log("📊 Dashboard Data:", res.data); // ✅ Existing improved

      setData(res.data || {});

    } catch (error) {

      console.error("❌ Dashboard API error:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);

    }
  };

  return (
    <div className="cards">

      {/* Total Employees */}
      <div className="card">
        <div className="card-top">
          <div>
            <p className="card-label">Total Employees</p>
            <h2 className="card-value">{data?.totalEmployees || 0}</h2>
            <span className="card-change green">
               Total
            </span>
          </div>
          <div className="icon green">
            <FaUsers />
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="card">
        <div className="card-top">
          <div>
            <p className="card-label">Departments</p>
            <h2 className="card-value">{data?.totalDepartments || 0}</h2>
            <span className="card-change">
              Active
            </span>
          </div>
          <div className="icon blue">
            <FaBuilding />
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="card">
        <div className="card-top">
          <div>
            <p className="card-label">Active Projects</p>
            <h2 className="card-value">{data?.activeProjects || 0}</h2>
            <span className="card-change">
              Running
            </span>
          </div>
          <div className="icon orange">
            <FaProjectDiagram />
          </div>
        </div>
      </div>

      {/* Attendance */}
      <div className="card">
        <div className="card-top">
          <div>
            <p className="card-label">Attendance Today</p>
            <h2 className="card-value">{data?.attendancePercentage || 0}%</h2>
            <span className="card-change green">
              Today
            </span>
          </div>
          <div className="icon teal">
            <FaCalendarCheck />
          </div>
        </div>
      </div>

    </div>
  );
}

export default TopCharts;
