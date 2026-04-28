import React, { useState, useEffect } from "react";
import "./Holidays.css";
import { FaCalendarAlt } from "react-icons/fa";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

// ✅ ADD THIS
const normalize = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/^user\s+/i, "")
    .replace(/^admin\s+/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

const hasAdminHolidayPermission = () => {
  const modules =
    JSON.parse(localStorage.getItem("modules")) ||
    JSON.parse(sessionStorage.getItem("modules")) ||
    [];

  return modules.some(
    (m) => normalize(m.moduleName).includes("holiday")
  );
};

function Holidays() {
  const token = localStorage.getItem("token");

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);

  const [newHoliday, setNewHoliday] = useState({
    id: null,
    name: "",
    date: "",
    day: "",
    type: ""
  });

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

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {

    if (e.target.name === "date") {

      const selectedDate = e.target.value;

      const day = new Date(selectedDate).toLocaleDateString("en-US", {
        weekday: "long"
      });

      setNewHoliday({
        ...newHoliday,
        date: selectedDate,
        day
      });

    } else {

      setNewHoliday({
        ...newHoliday,
        [e.target.name]: e.target.value
      });

    }
  };

  /* ================= SAVE HOLIDAY ================= */

  const handleSaveHoliday = async () => {

    if (!newHoliday.name || !newHoliday.date || !newHoliday.type) return;

    const payload = {
      holiday_Name: newHoliday.name,
      holiday_Date: new Date(newHoliday.date).toISOString(),
      day: newHoliday.day,
      type: newHoliday.type
    };

    try {

      let response;

      if (editMode) {

        await api.put(
          API_ENDPOINTS.company.holidays.byId(newHoliday.id),
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            }
          }
        );

      } else {

        await api.post(API_ENDPOINTS.company.holidays.list, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        });

      }

      closeModal();
      fetchHolidays();

    } catch (error) {
      console.error("Save error:", error);
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (holiday) => {

    setNewHoliday({
      id: holiday.id,
      name: holiday.name,
      date: holiday.date,
      day: holiday.day,
      type: holiday.type
    });

    setEditMode(true);
    setShowHolidayModal(true);
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {

    try {

      await api.delete(API_ENDPOINTS.company.holidays.byId(holidayToDelete), {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      setHolidayToDelete(null);
      fetchHolidays();

    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /* ================= RESET MODAL ================= */

  const closeModal = () => {

    setShowHolidayModal(false);
    setEditMode(false);

    setNewHoliday({
      id: null,
      name: "",
      date: "",
      day: "",
      type: ""
    });
  };

  /* ================= UI ================= */

  return (
    <div className="holiday-page">

      <div className="holiday-header">

        <div>
          <h2>Company Holidays</h2>
          <p>{holidays.length} holidays this year</p>
        </div>

        <button
          className="holiday-add-btn"
          onClick={() => {
            closeModal();
            setShowHolidayModal(true);
          }}
        >
          + Add Holiday
        </button>

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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {holidays.map((h, i) => (

              <tr key={h.id}>

                <td>{i + 1}</td>

                <td>
                  <FaCalendarAlt /> {h.name}
                </td>

                <td>{h.date}</td>
                <td>{h.day}</td>
                <td>{h.type}</td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(h)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => setHolidayToDelete(h.id)}
                  >
                    Delete
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* ADD / EDIT MODAL */}

      {showHolidayModal && (

        <div className="holiday-modal-overlay">

          <div className="holiday-modal-box">

            <h3>{editMode ? "Edit Holiday" : "Add Holiday"}</h3>

            <input
              name="name"
              value={newHoliday.name}
              onChange={handleChange}
              placeholder="Holiday Name"
            />

            <input
              type="date"
              name="date"
              value={newHoliday.date}
              onChange={handleChange}
            />

            <input
              name="day"
              value={newHoliday.day}
              readOnly
            />

            <select
              name="type"
              value={newHoliday.type}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              <option value="National">National</option>
              <option value="Festival">Festival</option>
              <option value="Company">Company</option>
            </select>

            <div className="holiday-modal-btns">

              <button onClick={closeModal}>
                Cancel
              </button>

              <button
                className="holiday-save-btn"
                onClick={handleSaveHoliday}
              >
                {editMode ? "Update" : "Add"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {holidayToDelete && (

        <div className="holiday-modal-overlay">

          <div className="holiday-modal-box">

            <h3>Confirm Delete</h3>

            <p>Are you sure you want to delete this holiday?</p>

            <div className="holiday-modal-btns">

              <button
                onClick={() => setHolidayToDelete(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ccc",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>

              <button
                className="holiday-delete-btn"
                onClick={handleDelete}
              >
                Yes Delete
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Holidays;
