import React, { useState, useEffect } from "react";
import "./Holidays.css";
import { FaCalendarAlt } from "react-icons/fa";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function Holidays() {
  const token = localStorage.getItem("token");

  const [holidays, setHolidays] = useState([]);

  /* ================= FETCH HOLIDAYS ================= */

  const fetchHolidays = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.company.holidays.list, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const data = res.data;

      if (!Array.isArray(data)) {
        setHolidays([]);
        return;
      }

      const formatted = data
        .filter(
          item =>
            item.holiday_Name &&
            item.holiday_Name.trim() !== "" &&
            item.holiday_Date !== "0001-01-01T00:00:00"
        )
        .map(item => ({
          id: item.id,
          name: item.holiday_Name,
          date: item.holiday_Date
            ? item.holiday_Date.split("T")[0]
            : "",
          day: item.day || "",
          type: item.type || ""
        }));

      setHolidays(formatted);

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* ================= UI ================= */

  return (
    <div className="holiday-page">

      <div className="holiday-header">
        <div>
          <h2>Company Holidays</h2>
          <p>{holidays.length} holidays this year</p>
        </div>
      </div>

      <div className="holiday-table-wrapper">

        <table className="holiday-table">

          <thead>
            <tr>
              <th>S.No</th>
              <th>Holiday Name</th>
              <th>Date</th>
              <th>Day</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>

            {holidays.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No Holidays Found
                </td>
              </tr>
            ) : (
              holidays.map((h, i) => (
                <tr key={h.id}>
                  <td>{i + 1}</td>

                  <td>
                    <FaCalendarAlt /> {h.name}
                  </td>

                  <td>{h.date}</td>
                  <td>{h.day}</td>
                  <td>{h.type}</td>
                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Holidays;
