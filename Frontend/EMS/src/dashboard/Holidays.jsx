import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function Holidays() {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.company.holidays.list);

      console.log("Holiday API:", res.data);

      const data = Array.isArray(res.data) ? res.data : [];
      const today = new Date();

      const upcomingHolidays = data
        .filter(
          (h) =>
            h.holiday_Name &&
            h.holiday_Date !== "0001-01-01T00:00:00" &&
            new Date(h.holiday_Date) >= today
        )
        .sort(
          (a, b) => new Date(a.holiday_Date) - new Date(b.holiday_Date)
        )
        .slice(0, 3); // show only 3 holidays

      setHolidays(upcomingHolidays);
    } catch (error) {
      console.error("Holiday fetch error:", error);
      setHolidays([]);
    }
  };

  return (
    <div className="holidays">
      <h3>Upcoming Holidays</h3>

      <div className="holiday-list">
        {holidays.length === 0 ? (
          <p>No upcoming holidays</p>
        ) : (
          holidays.map((holiday, index) => (
            <div className="holiday-item" key={index}>
              <span className="holiday-name">
                {holiday.holiday_Name}
              </span>

              <span className="holiday-date">
                {new Date(holiday.holiday_Date).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Holidays;
