import React, { useState, useEffect } from "react";
import AttendanceTable from "./AttendanceTable";
import "./AttendanceTable.css";
import { useLocation } from "react-router-dom";

function Attendance() {
  const [viewMode, setViewMode] = useState("monthly");
  const location = useLocation();

  const [filter, setFilter] = useState(
    location.state?.filter || "All"
  );
  const [search, setSearch] = useState("");

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const tabs = ["All", "Present", "Late", "Absent", "Half Day", "On Leave"];

  useEffect(() => {
    if (location.state?.filter) {
      setFilter(location.state.filter);
      setViewMode("daily"); // 🔥 force Daily view
    }
  }, [location.state]);

  const handleMonthChange = (e) => {
    const value = e.target.value; // format: YYYY-MM
    if (!value) return;

    const [selectedYear, selectedMonth] = value.split("-");
    setYear(Number(selectedYear));
    setMonth(Number(selectedMonth));
  };

  const formattedMonthValue = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h2>Attendance</h2>
          <p className="attendance-subtitle">Monitoring employees</p>
        </div>

        <div className="attendance-top-controls">
          <select
            className="attendance-select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>

          {viewMode === "monthly" && (
            <input
              type="month"
              className="attendance-month-picker"
              value={formattedMonthValue}
              onChange={handleMonthChange}
            />
          )}
        </div>
      </div>

      <div className="attendance-toolbar">
        <input
          className="attendance-search"
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="attendance-filters">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={filter === tab ? "active" : ""}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AttendanceTable
        viewMode={viewMode}
        filter={filter}
        search={search}
        month={month}
        year={year}
      />
    </div>
  );
}

export default Attendance;