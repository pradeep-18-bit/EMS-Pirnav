import React, { useEffect, useState } from "react";
import "./UserAttendance.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  FaSignInAlt,
  FaSignOutAlt,
  FaClock,
  FaRegCalendarAlt,
  FaArrowRight,
  FaArrowLeft
} from "react-icons/fa";
 
function UserAttendance() {
  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");
 
  const today = new Date();
 
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewType, setViewType] = useState("week");
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    checkIn: "--",
    checkOut: "--",
    workedHours: "--"
  });
 
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
 
  const formatTime = (value) => {
    if (!value) return "—";
 
    if (typeof value === "string" && value.includes("T")) {
      return new Date(value).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }
 
    return value;
  };
 
  const formatHoursFromMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) return "—";
 
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
 
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };
 
  const normalizeStatus = (status) => {
    const value = (status || "").toLowerCase().trim();
 
    if (value === "present") return "Present";
    if (value === "absent") return "Absent";
    if (value === "late") return "Late";
    if (value === "half day" || value === "halfday") return "Half Day";
    if (value === "leave" || value === "on leave" || value === "onleave")
      return "On Leave";
    if (value === "weekend") return "Weekend";
 
    return status || "-";
  };
 
  const formatDateLabel = (item) => {
    if (item.date) {
      return new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
    }
 
    if (item.day) {
      return `Day ${item.day}`;
    }
 
    return "";
  };
 
  const formatDayName = (item) => {
    if (item.date) {
      return new Date(item.date).toLocaleDateString("en-US", {
        weekday: "short"
      });
    }
 
    if (item.dayName) return item.dayName;
    return "-";
  };
 
  const mapApiData = (data) => {
    return (Array.isArray(data) ? data : []).map((item, index) => ({
      id: item.id || `${item.date || item.day || index}`,
      rawDate: item.date || "",
      day: formatDayName(item),
      dateLabel: formatDateLabel(item),
      checkIn: formatTime(item.checkIn),
      checkOut: formatTime(item.checkOut),
      hours: item.hours || formatHoursFromMinutes(item.workingMinutes),
      status: normalizeStatus(item.status)
    }));
  };
 
  const updateTopStats = (rows) => {
    if (!rows.length) {
      setStats({
        checkIn: "--",
        checkOut: "--",
        workedHours: "--"
      });
      return;
    }
 
    const todayStr = new Date().toDateString();
 
    const todayRow = rows.find((row) => {
      if (!row.rawDate) return false;
      return new Date(row.rawDate).toDateString() === todayStr;
    });
 
    if (todayRow) {
      setStats({
        checkIn: todayRow.checkIn || "--",
        checkOut: todayRow.checkOut || "--",
        workedHours: todayRow.hours || "--"
      });
    } else {
      setStats({
        checkIn: "--",
        checkOut: "--",
        workedHours: "--"
      });
    }
  };
 
  const updateTodayAttendanceState = (rows) => {
    const todayStr = new Date().toDateString();
 
    const todayRow = rows.find((row) => {
      if (!row.rawDate) return false;
      return new Date(row.rawDate).toDateString() === todayStr;
    });
 
    if (todayRow) {
      setCheckedIn(todayRow.checkIn && todayRow.checkIn !== "—");
      setCheckedOut(todayRow.checkOut && todayRow.checkOut !== "—");
    } else {
      setCheckedIn(false);
      setCheckedOut(false);
    }
  };
 
  const fetchWeeklySummary = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.attendance.weekly, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        }
      });

      const data = res.data;
      const mapped = mapApiData(data);
      updateTopStats(mapped);
      updateTodayAttendanceState(mapped);
    } catch (err) {
      console.error("Weekly fetch failed:", err?.response?.data || err.message);
    }
  };
 
  const fetchAttendanceHistory = async (type) => {
    try {
      setHistoryLoading(true);
 
      let apiUrl = API_ENDPOINTS.attendance.weekly;
 
      if (type === "lastWeek") {
        apiUrl = API_ENDPOINTS.attendance.previousWeek;
      } else if (type === "month") {
        apiUrl = API_ENDPOINTS.attendance.previousMonth;
      }
 
      const res = await api.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        }
      });

      const data = res.data;
      const mapped = mapApiData(data);
      setAttendanceData(mapped);
 
      if (type === "week") {
        updateTopStats(mapped);
        updateTodayAttendanceState(mapped);
      }
    } catch (err) {
      console.error("History fetch failed:", err?.response?.data || err.message);
      setAttendanceData([]);
    } finally {
      setHistoryLoading(false);
    }
  };
 
  useEffect(() => {
    fetchWeeklySummary();
    fetchAttendanceHistory("week");
  }, []);
 
  useEffect(() => {
    fetchAttendanceHistory(viewType);
  }, [viewType]);
 
  const handleCheckIn = async () => {
    setLoading(true);
 
    try {
      await api.post(
        API_ENDPOINTS.attendance.checkIn,
        null,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          }
        }
      );
 
      toast.success("Checked in successfully");
      setCheckedIn(true);
      setCheckedOut(false);
 
      await fetchWeeklySummary();
      await fetchAttendanceHistory(viewType);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      toast.error("Server error during check-in");
    }
 
    setLoading(false);
  };
 
  const handleCheckOut = async () => {
    setLoading(true);
 
    try {
      await api.post(
        API_ENDPOINTS.attendance.checkOut,
        null,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          }
        }
      );
 
      toast.success("Checked out successfully");
      setCheckedOut(true);
 
      await fetchWeeklySummary();
      await fetchAttendanceHistory(viewType);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      toast.error("Server error during check-out");
    }
 
    setLoading(false);
  };
 
  const getStatusClass = (status) => {
    const value = normalizeStatus(status).toLowerCase().replace(/\s+/g, "");
 
    if (value === "present") return "present";
    if (value === "absent") return "absent";
    if (value === "late") return "late";
    if (value === "halfday") return "halfday";
    if (value === "onleave") return "leave";
    if (value === "weekend") return "weekend";
 
    return "default";
  };
 
  return (
    <div className="attendance-page">
      <ToastContainer position="top-right" autoClose={3000} />
 
      <div className="attendance-card">
        <h3>Mark Attendance</h3>
        <h1>{formattedDate}</h1>
 
        <div className="attendance-buttons">
          <button
            className="checkin-btn"
            onClick={handleCheckIn}
            disabled={checkedIn || loading}
          >
            <FaSignInAlt />
            {loading ? "Processing..." : "Check In"}
          </button>
 
          <button
            className="checkout-btn"
            onClick={handleCheckOut}
            disabled={!checkedIn || checkedOut || loading}
          >
            <FaSignOutAlt />
            {loading ? "Processing..." : "Check Out"}
          </button>
        </div>
 
        <div className="attendance-stats-row">
          <div className="attendance-stat-box">
            <div className="stat-icon checkin-icon">
              <FaArrowRight />
            </div>
            <div className="stat-label">Check In</div>
            <div className="stat-value">{stats.checkIn}</div>
          </div>
 
          <div className="attendance-stat-box">
            <div className="stat-icon checkout-icon">
              <FaArrowLeft />
            </div>
            <div className="stat-label">Check Out</div>
            <div className="stat-value">{stats.checkOut}</div>
          </div>
 
          <div className="attendance-stat-box">
            <div className="stat-icon hours-icon">
              <FaClock />
            </div>
            <div className="stat-label">Hours</div>
            <div className="stat-value">{stats.workedHours}</div>
          </div>
        </div>
      </div>
 
      <div className="week-card">
        <div className="week-header">
          <h3>
            <FaRegCalendarAlt className="week-title-icon" />
            {viewType === "week"
              ? "This Week"
              : viewType === "lastWeek"
                ? "Last Week"
                : "This Month"}
          </h3>
 
          <div className="week-toggle">
            <button
              className={viewType === "week" ? "active" : ""}
              onClick={() => setViewType("week")}
            >
              Week
            </button>
 
            <button
              className={viewType === "lastWeek" ? "active" : ""}
              onClick={() => setViewType("lastWeek")}
            >
              Last Week
            </button>
 
            <button
              className={viewType === "month" ? "active" : ""}
              onClick={() => setViewType("month")}
            >
              Month
            </button>
          </div>
        </div>
 
        <div className="week-table-header">
          <span>DAY</span>
          <span>CHECK IN</span>
          <span>CHECK OUT</span>
          <span>HOURS</span>
          <span>STATUS</span>
        </div>
 
        {historyLoading ? (
          <div className="attendance-empty">Loading attendance...</div>
        ) : attendanceData.length === 0 ? (
          <div className="attendance-empty">No attendance data found</div>
        ) : (
          attendanceData.map((item) => (
            <div key={item.id} className="week-row">
              <div className="week-day-cell">
                <div>{item.day}</div>
                <small>{item.dateLabel}</small>
              </div>
 
              <span>{item.checkIn}</span>
              <span>{item.checkOut}</span>
              <span>{item.hours}</span>
 
              <span className={`status ${getStatusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
 
export default UserAttendance;
 
