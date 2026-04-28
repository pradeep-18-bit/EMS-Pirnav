import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./AttendanceTable.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function AttendanceTable({
  viewMode = "daily",
  filter = "All",
  search = "",
  month,
  year
}) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // ADMIN EDIT STATES
  // =========================
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    employeeId: "",
    date: "",
    checkIn: "",
    checkOut: ""
  });

  const token = localStorage.getItem("token");

  // =========================
  // DEFAULT OFFICE TIME
  // =========================
  const DEFAULT_CHECKIN = "09:00";
  const DEFAULT_CHECKOUT = "18:00";

  // =========================
  // HELPERS
  // =========================
  const getEmployeeId = (emp) => {
    return (
      emp?.employeeId ||
      emp?.id ||
      emp?._id ||
      emp?.empId ||
      emp?.staffId ||
      emp?.userId ||
      emp?.employee?.employeeId ||
      emp?.employee?.id ||
      emp?.employee?._id ||
      ""
    );
  };

  const getEmployeeName = (emp) => {
    return (
      emp?.name ||
      emp?.employeeName ||
      emp?.fullName ||
      emp?.employee?.name ||
      emp?.user?.name ||
      "Unknown"
    );
  };

  const getEmployeeDept = (emp) => {
    return (
      emp?.department ||
      emp?.designation ||
      emp?.employee?.department ||
      emp?.user?.department ||
      "Employee"
    );
  };

  const getCheckIn = (emp) => {
    return emp?.checkIn || emp?.checkInTime || emp?.inTime || null;
  };

  const getCheckOut = (emp) => {
    return emp?.checkOut || emp?.checkOutTime || emp?.outTime || null;
  };

  const formatHoursWorked = (emp) => {
    return (
      emp?.hoursWorked ||
      emp?.totalHours ||
      emp?.workingHours ||
      emp?.hours ||
      "-"
    );
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return value;
    }
  };

  const getProgressWidth = (emp) => {
    const rawHours =
      emp?.hoursWorked ||
      emp?.totalHours ||
      emp?.workingHours ||
      emp?.hours ||
      "0";

    const match = String(rawHours).match(/(\d+(\.\d+)?)/);
    const hours = match ? parseFloat(match[1]) : 0;

    if (!hours || isNaN(hours)) return 0;

    return Math.min((hours / 9) * 100, 100);
  };

  // safer local YYYY-MM-DD formatter
  const formatDateForInput = (value) => {
    try {
      const date = value ? new Date(value) : new Date();
      if (isNaN(date.getTime())) return "";

      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // TIME ONLY FOR INPUT
  const formatTimeForInput = (value) => {
    if (!value) return "";

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "";

      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const buildDateFromDay = (dayNumber) => {
    try {
      if (!month || !year || !dayNumber) return "";

      const pad = (n) => String(n).padStart(2, "0");
      return `${year}-${pad(month)}-${pad(dayNumber)}`;
    } catch {
      return "";
    }
  };

  const getDefaultEditTimes = (checkIn, checkOut) => {
    return {
      checkIn: formatTimeForInput(checkIn) || DEFAULT_CHECKIN,
      checkOut: formatTimeForInput(checkOut) || DEFAULT_CHECKOUT
    };
  };

  // =========================
  // DATE HELPERS
  // =========================
  const todayString = useMemo(() => {
    return formatDateForInput(new Date());
  }, []);

  const isFutureDate = useCallback(
    (dateStr) => {
      if (!dateStr) return false;
      return dateStr > todayString; // safe because YYYY-MM-DD
    },
    [todayString]
  );

  const isFutureDay = useCallback(
    (dayNumber) => {
      const dateStr = buildDateFromDay(dayNumber);
      return isFutureDate(dateStr);
    },
    [buildDateFromDay, isFutureDate]
  );

  // =========================
  // STATUS NORMALIZATION (FIXED)
  // =========================
  const normalizeStatus = (status) => {
    const raw = String(status || "").trim();
    const s = raw.toUpperCase();

    // PRESENT
    if (s === "P" || s === "PRESENT") return "Present";

    // ABSENT
    if (s === "A" || s === "ABSENT") return "Absent";

    // ON LEAVE  ✅ FIXED
    // Important: many systems send "L" for Leave
    if (
      s === "OL" ||
      s === "ON LEAVE" ||
      s === "LEAVE" ||
      s === "L"
    ) {
      return "On Leave";
    }

    // LATE  ✅ use LT or LATE only
    if (s === "LT" || s === "LATE") return "Late";

    // WEEKEND
    if (s === "W" || s === "WEEKEND") return "Weekend";

    // HALF DAY
    if (s === "HD" || s === "HALF DAY" || s === "HALFDAY") return "Half Day";

    // HOLIDAY
    if (s === "H" || s === "HOLIDAY") return "Holiday";

    return raw || "-";
  };

  const getStatusClass = (status) => {
    const s = normalizeStatus(status);

    if (s === "Present") return "badge-present";
    if (s === "Absent") return "badge-absent";
    if (s === "On Leave") return "badge-leave";
    if (s === "Late") return "badge-late";
    if (s === "Half Day") return "badge-halfday";
    if (s === "Weekend") return "badge-weekend";
    if (s === "Holiday") return "badge-holiday";

    return "badge-default";
  };

  const getDayCellText = (dayObj) => {
    const status = normalizeStatus(dayObj?.status || "");

    if (status === "Present") return "P";
    if (status === "Absent") return "A";
    if (status === "On Leave") return "OL";
    if (status === "Late") return "LT";
    if (status === "Weekend") return "W";
    if (status === "Half Day") return "HD";
    if (status === "Holiday") return "H";

    return "-";
  };

  const getDayCellClass = (dayObj) => {
    const status = normalizeStatus(dayObj?.status || "");

    if (status === "Present") return "monthly-status present";
    if (status === "Absent") return "monthly-status absent";
    if (status === "On Leave") return "monthly-status leave";
    if (status === "Late") return "monthly-status late";
    if (status === "Weekend") return "monthly-status weekend";
    if (status === "Half Day") return "monthly-status halfday";
    if (status === "Holiday") return "monthly-status holiday";

    return "monthly-status empty";
  };

  // =========================
  // FETCH DAILY / MONTHLY
  // =========================
  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get(API_ENDPOINTS.attendance.today, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setAttendanceData(raw);
    } catch (err) {
      console.error("Daily Error:", err?.response?.data || err.message);
      setAttendanceData([]);
      toast.error("Failed to fetch daily attendance");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMonthlyAttendance = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get(API_ENDPOINTS.attendance.monthly, {
        params: { month, year },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setAttendanceData(raw);
    } catch (err) {
      console.error("Monthly Error:", err?.response?.data || err.message);
      setAttendanceData([]);
      toast.error("Failed to fetch monthly attendance");
    } finally {
      setLoading(false);
    }
  }, [month, year, token]);

  useEffect(() => {
    if (viewMode === "daily") {
      fetchTodayAttendance();
    } else {
      fetchMonthlyAttendance();
    }
  }, [viewMode, month, year, fetchTodayAttendance, fetchMonthlyAttendance]);

  // =========================
  // FAST FILTERING
  // =========================
  const matchesSearch = useCallback(
    (emp) => {
      const name = getEmployeeName(emp).toLowerCase();
      const id = String(getEmployeeId(emp)).toLowerCase();
      const searchText = search.toLowerCase().trim();

      if (!searchText) return true;
      return name.includes(searchText) || id.includes(searchText);
    },
    [search]
  );

  // =========================
  // NORMALIZE MONTHLY DATA ONCE
  // =========================
  const normalizedMonthlyData = useMemo(() => {
    if (viewMode !== "monthly") return [];

    return attendanceData.map((emp) => {
      const rawDays = Array.isArray(emp?.days) ? emp.days : [];

      const dayMap = {};
      let present = 0;
      let absent = 0;
      let onLeave = 0;
      let late = 0;
      let weekend = 0;
      let halfDay = 0;
      let holiday = 0;

      rawDays.forEach((d) => {
        const dayNum = Number(d?.day);
        if (!dayNum) return;

        const normalizedDay = {
          ...d,
          status: normalizeStatus(d?.status)
        };

        dayMap[dayNum] = normalizedDay;

        if (normalizedDay.status === "Present") present++;
        else if (normalizedDay.status === "Absent") absent++;
        else if (normalizedDay.status === "On Leave") onLeave++;
        else if (normalizedDay.status === "Late") late++;
        else if (normalizedDay.status === "Weekend") weekend++;
        else if (normalizedDay.status === "Half Day") halfDay++;
        else if (normalizedDay.status === "Holiday") holiday++;
      });

      return {
        ...emp,
        __dayMap: dayMap,
        __counts: {
          present,
          absent,
          onLeave,
          late,
          weekend,
          halfDay,
          holiday
        }
      };
    });
  }, [attendanceData, viewMode]);

  // =========================
  // FILTERED DATA
  // =========================
  const filteredDailyData = useMemo(() => {
    if (viewMode !== "daily") return [];

    return attendanceData.filter((item) => {
      const finalStatus = normalizeStatus(item?.status);
      const filterMatch = filter === "All" || finalStatus === filter;
      return matchesSearch(item) && filterMatch;
    });
  }, [attendanceData, filter, matchesSearch, viewMode]);

  const filteredMonthlyData = useMemo(() => {
    if (viewMode !== "monthly") return [];

    return normalizedMonthlyData.filter((emp) => {
      if (!matchesSearch(emp)) return false;
      if (filter === "All") return true;

      return Object.values(emp.__dayMap || {}).some(
        (d) => normalizeStatus(d?.status) === filter
      );
    });
  }, [normalizedMonthlyData, filter, matchesSearch, viewMode]);

  // =========================
  // ADMIN UPDATE ATTENDANCE
  // =========================
  const openEditModal = (emp) => {
    const employeeId = getEmployeeId(emp);
    const checkIn = getCheckIn(emp);
    const checkOut = getCheckOut(emp);
    const { checkIn: defaultIn, checkOut: defaultOut } = getDefaultEditTimes(
      checkIn,
      checkOut
    );

    const selectedDate = formatDateForInput(checkIn || checkOut || new Date());

    if (isFutureDate(selectedDate)) {
      toast.warning("You cannot edit attendance for a future date");
      return;
    }

    setSelectedEmployee(emp);
    setEditForm({
      employeeId,
      date: selectedDate,
      checkIn: defaultIn,
      checkOut: defaultOut
    });
    setEditModalOpen(true);
  };

  const openMonthlyDayEditModal = (emp, dayObj, dayNumber) => {
    const employeeId = getEmployeeId(emp);
    const selectedDate = buildDateFromDay(dayNumber);

    if (isFutureDate(selectedDate)) {
      toast.warning("You cannot edit attendance for a future date");
      return;
    }

    const checkIn =
      dayObj?.checkIn || dayObj?.checkInTime || dayObj?.inTime || null;

    const checkOut =
      dayObj?.checkOut || dayObj?.checkOutTime || dayObj?.outTime || null;

    const { checkIn: defaultIn, checkOut: defaultOut } = getDefaultEditTimes(
      checkIn,
      checkOut
    );

    setSelectedEmployee(emp);
    setEditForm({
      employeeId,
      date: selectedDate,
      checkIn: defaultIn,
      checkOut: defaultOut
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedEmployee(null);
    setEditForm({
      employeeId: "",
      date: "",
      checkIn: "",
      checkOut: ""
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "date" && isFutureDate(value)) {
      toast.warning("Future attendance cannot be edited");
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateAttendance = async () => {
    try {
      if (!editForm.employeeId || !editForm.date) {
        toast.warning("Employee ID and Date are required");
        return;
      }

      if (isFutureDate(editForm.date)) {
        toast.error("You cannot update attendance for a future date");
        return;
      }

      if (
        editForm.checkIn &&
        editForm.checkOut &&
        editForm.checkOut < editForm.checkIn
      ) {
        toast.error("Check Out time cannot be earlier than Check In time");
        return;
      }

      setUpdateLoading(true);

      const checkInDateTime = editForm.checkIn
        ? `${editForm.date}T${editForm.checkIn}:00`
        : null;

      const checkOutDateTime = editForm.checkOut
        ? `${editForm.date}T${editForm.checkOut}:00`
        : null;

      await api.post(
        API_ENDPOINTS.attendance.adminUpdate,
        {},
        {
          params: {
            employeeId: editForm.employeeId,
            date: editForm.date,
            checkIn: checkInDateTime,
            checkOut: checkOutDateTime
          },
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      toast.success("Attendance updated successfully");
      closeEditModal();

      if (viewMode === "daily") {
        await fetchTodayAttendance();
      } else {
        await fetchMonthlyAttendance();
      }
    } catch (err) {
      console.error(
        "Update Attendance Error:",
        err?.response?.data || err.message
      );

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data;

      if (
        String(backendMessage || "")
          .toLowerCase()
          .includes("future")
      ) {
        toast.error("You cannot update attendance for a future date");
      } else {
        toast.error(
          backendMessage || "Failed to update attendance. Please check the values."
        );
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  // =========================
  // MONTHLY HELPERS
  // =========================
  const daysInMonth = useMemo(() => {
    if (!month || !year) return 31;
    return new Date(year, month, 0).getDate();
  }, [month, year]);

  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const monthLabel = useMemo(() => {
    if (!month || !year) return "";
    return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    });
  }, [month, year]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />

      <div className="attendance-table">
        {viewMode === "daily" ? (
          <>
            <div className="attendance-table-header attendance-table-header-5">
              <span>EMPLOYEE</span>
              <span>STATUS</span>
              <span>CHECK IN</span>
              <span>CHECK OUT</span>
              <span>HOURS WORKED</span>
            </div>

            {loading ? (
              <p className="attendance-empty">Loading...</p>
            ) : filteredDailyData.length === 0 ? (
              <p className="attendance-empty">No Data</p>
            ) : (
              filteredDailyData.map((emp, i) => {
                const progressWidth = getProgressWidth(emp);
                const finalStatus = normalizeStatus(emp.status);

                return (
                  <div
                    key={`${getEmployeeId(emp)}-${getEmployeeName(emp)}-${i}`}
                    className="attendance-row attendance-row-5"
                  >
                    <div className="attendance-employee">
                      <div className="avatar">
                        {getEmployeeName(emp).charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="emp-name">{getEmployeeName(emp)}</div>
                        <div className="emp-dept">{getEmployeeDept(emp)}</div>
                      </div>
                    </div>

                    <div>
                      <span className={`status-badge ${getStatusClass(finalStatus)}`}>
                        {finalStatus}
                      </span>
                    </div>

                    <div className="time-text">
                      {formatDateTime(getCheckIn(emp))}
                    </div>

                    <div className="time-text">
                      {formatDateTime(getCheckOut(emp))}
                    </div>

                    <div className="hours-worked">
                      <div className="progress-bar">
                        <div
                          className="progress progress-blue"
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                      <span className="hours-text">
                        {formatHoursWorked(emp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        ) : (
          <div className="monthly-wrapper">
            <div className="monthly-title-row">
              <h3>Monthly Attendance</h3>
              <span className="monthly-month-label">{monthLabel}</span>
            </div>

            {loading ? (
              <p className="attendance-empty">Loading monthly attendance...</p>
            ) : filteredMonthlyData.length === 0 ? (
              <p className="attendance-empty">No monthly data found</p>
            ) : (
              <>
                <div className="monthly-scroll">
                  <div
                    className="monthly-grid"
                    style={{
                      gridTemplateColumns: `220px repeat(${daysArray.length}, 42px) 50px 50px 55px 50px 50px 55px 50px 90px`
                    }}
                  >
                    <div className="monthly-head employee-col sticky-col">
                      EMPLOYEE
                    </div>

                    {daysArray.map((day) => (
                      <div key={day} className="monthly-head day-head">
                        {day}
                      </div>
                    ))}

                    <div className="monthly-head summary-head present-text">P</div>
                    <div className="monthly-head summary-head absent-text">A</div>
                    <div className="monthly-head summary-head leave-text">OL</div>
                    <div className="monthly-head summary-head late-text">LT</div>
                    <div className="monthly-head summary-head weekend-text">W</div>
                    <div className="monthly-head summary-head halfday-text">HD</div>
                    <div className="monthly-head summary-head holiday-text">H</div>
                    <div className="monthly-head summary-head">ACTION</div>

                    {filteredMonthlyData.map((emp, index) => {
                      const counts = emp.__counts || {};

                      return (
                        <React.Fragment
                          key={`${getEmployeeId(emp)}-${getEmployeeName(emp)}-${index}`}
                        >
                          <div className="monthly-employee-cell sticky-col">
                            <div className="attendance-employee">
                              <div className="avatar">
                                {getEmployeeName(emp).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="emp-name">{getEmployeeName(emp)}</div>
                                <div className="emp-dept">
                                  {getEmployeeId(emp) || getEmployeeDept(emp)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {daysArray.map((day) => {
                            const dayObj = emp.__dayMap?.[day];
                            const status = normalizeStatus(dayObj?.status);
                            const futureDay = isFutureDay(day);

                            return (
                              <div
                                key={`${getEmployeeId(emp)}-${day}`}
                                className={`monthly-day-cell ${
                                  futureDay ? "disabled-future-day" : "clickable-day"
                                }`}
                                title={
                                  futureDay
                                    ? `Day ${day}: Future date cannot be edited`
                                    : `Day ${day}: ${status || "-"} (Click to Edit)`
                                }
                                onClick={() => {
                                  if (!futureDay) {
                                    openMonthlyDayEditModal(emp, dayObj, day);
                                  } else {
                                    toast.warning(
                                      "You cannot edit attendance for a future date"
                                    );
                                  }
                                }}
                              >
                                <span className={getDayCellClass(dayObj)}>
                                  {getDayCellText(dayObj)}
                                </span>
                              </div>
                            );
                          })}

                          <div className="monthly-count present-text">
                            {counts.present || 0}
                          </div>
                          <div className="monthly-count absent-text">
                            {counts.absent || 0}
                          </div>
                          <div className="monthly-count leave-text">
                            {counts.onLeave || 0}
                          </div>
                          <div className="monthly-count late-text">
                            {counts.late || 0}
                          </div>
                          <div className="monthly-count weekend-text">
                            {counts.weekend || 0}
                          </div>
                          <div className="monthly-count halfday-text">
                            {counts.halfDay || 0}
                          </div>
                          <div className="monthly-count holiday-text">
                            {counts.holiday || 0}
                          </div>

                          <div className="monthly-count">
                            <button
                              className="attendance-edit-btn monthly-edit-btn"
                              onClick={() => openEditModal(emp)}
                            >
                              Edit
                            </button>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="monthly-legend">
                  <span><span className="legend-dot present" /> Present</span>
                  <span><span className="legend-dot absent" /> Absent</span>
                  <span><span className="legend-dot leave" /> On Leave</span>
                  <span><span className="legend-dot late" /> Late</span>
                  <span><span className="legend-dot weekend" /> Weekend</span>
                  <span><span className="legend-dot halfday" /> Half Day</span>
                  <span><span className="legend-dot holiday" /> Holiday</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal">
            <div className="attendance-modal-header">
              <h3>Update Attendance</h3>
              <button className="attendance-modal-close" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <div className="attendance-modal-body">
              <div className="attendance-modal-employee">
                <div className="avatar large">
                  {getEmployeeName(selectedEmployee).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="emp-name">{getEmployeeName(selectedEmployee)}</div>
                  <div className="emp-dept">
                    {getEmployeeId(selectedEmployee)} •{" "}
                    {getEmployeeDept(selectedEmployee)}
                  </div>
                </div>
              </div>

              <div className="attendance-form-grid">
                <div className="attendance-form-group">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={editForm.employeeId}
                    onChange={handleEditChange}
                    placeholder="Employee ID"
                  />
                </div>

                <div className="attendance-form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditChange}
                    max={todayString}
                  />
                </div>

                <div className="attendance-form-group">
                  <label>Check In</label>
                  <input
                    type="time"
                    name="checkIn"
                    value={editForm.checkIn}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="attendance-form-group">
                  <label>Check Out</label>
                  <input
                    type="time"
                    name="checkOut"
                    value={editForm.checkOut}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
            </div>

            <div className="attendance-modal-footer">
              <button className="attendance-cancel-btn" onClick={closeEditModal}>
                Cancel
              </button>
              <button
                className="attendance-save-btn"
                onClick={handleUpdateAttendance}
                disabled={updateLoading}
              >
                {updateLoading ? "Updating..." : "Update Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AttendanceTable;
