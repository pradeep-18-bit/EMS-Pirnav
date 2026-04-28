import React, { useEffect, useState } from "react";
import "./UserDashboard.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaCalendarCheck,
  FaPlaneDeparture,
  FaBell
} from "react-icons/fa";

function UserDashboard() {

  const navigate = useNavigate();

  const [data, setData] = useState({
    myTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    attendance: 0,
    recentActivities: [],
    upcomingHolidays: []
  });

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {

      const token = getToken();

      const res = await api.get(API_ENDPOINTS.userDashboard, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      console.log("User Dashboard:", res.data);

      const apiData = res.data || {};

      setData({
        myTasks: apiData.myTasks || 0,
        completedTasks: apiData.completedTasks || 0,
        pendingTasks: apiData.pendingTasks || 0,
        attendance: apiData.attendance || 0,
        recentActivities: apiData.recentActivities || [],
        upcomingHolidays: apiData.upcomingHolidays || []
      });

    } catch (error) {

      console.error(
        "User dashboard error:",
        error.response?.data || error.message
      );

    }
  };

  return (
    <div className="udb-wrapper">

      {/* HEADER */}

      <div className="udb-header">
        <h2 className="udb-title">Welcome Back 👋</h2>
        <p className="udb-subtitle">
          Here’s your personal dashboard overview
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="udb-cards">

        <div className="udb-card">
          <div className="udb-icon udb-blue">
            <FaTasks />
          </div>

          <div>
            <h4 className="udb-card-title">My Tasks</h4>
            <h2 className="udb-card-number">{data.myTasks}</h2>
            <span className="udb-card-text">
              {data.pendingTasks} pending
            </span>
          </div>
        </div>

        <div className="udb-card">
          <div className="udb-icon udb-green">
            <FaCheckCircle />
          </div>

          <div>
            <h4 className="udb-card-title">Completed Tasks</h4>
            <h2 className="udb-card-number">{data.completedTasks}</h2>
            <span className="udb-card-text">
              Completed
            </span>
          </div>
        </div>

        <div className="udb-card">
          <div className="udb-icon udb-orange">
            <FaClock />
          </div>

          <div>
            <h4 className="udb-card-title">Pending Tasks</h4>
            <h2 className="udb-card-number">{data.pendingTasks}</h2>
            <span className="udb-card-text">
              Need attention
            </span>
          </div>
        </div>

        <div className="udb-card">
          <div className="udb-icon udb-purple">
            <FaCalendarCheck />
          </div>

          <div>
            <h4 className="udb-card-title">Attendance</h4>
            <h2 className="udb-card-number">
              {Number(data.attendance).toFixed(1)}%
            </h2>
            <span className="udb-card-text">
              This month
            </span>
          </div>
        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="udb-main">

        {/* RECENT ACTIVITIES */}

        <div className="udb-section">

          <h3 className="udb-section-title">
            My Recent Activities
          </h3>

          {data.recentActivities.length === 0 ? (
            <p>No recent activities</p>
          ) : (
            data.recentActivities.map((item, index) => (
              <div key={index} className="udb-task-row">
                <span>{item.message || item.activity}</span>
              </div>
            ))
          )}

        </div>

        {/* HOLIDAYS */}

        <div className="udb-section">

          <h3 className="udb-section-title">
            Upcoming Holidays
          </h3>

          {data.upcomingHolidays.length === 0 ? (
            <p>No upcoming holidays</p>
          ) : (
            data.upcomingHolidays.map((holiday, index) => (
              <div className="udb-holiday-row" key={index}>
                <span>{holiday.holidayName}</span>
                <span>
                  {new Date(holiday.date).toLocaleDateString()}
                </span>
              </div>
            ))
          )}

        </div>

      </div>

      {/* QUICK ACTIONS */}

      <div className="udb-actions">

        <button
          className="udb-action-btn"
          onClick={() => navigate("/user-leave-management")}
        >
          <FaPlaneDeparture /> Apply Leave
        </button>

        <button
          className="udb-action-btn"
          onClick={() => navigate("/user-attendance")}
        >
          <FaCalendarCheck /> Mark Attendance
        </button>

        <button
          className="udb-action-btn"
          onClick={() => navigate("/user-tasks")}
        >
          <FaTasks /> View Tasks
        </button>

        <button
          className="udb-action-btn"
          onClick={() => navigate("/notifications")}
        >
          <FaBell /> Notifications
        </button>

      </div>

    </div>
  );
}

export default UserDashboard;
