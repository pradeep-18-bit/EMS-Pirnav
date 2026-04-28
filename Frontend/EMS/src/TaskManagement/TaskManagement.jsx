import React, { useState, useEffect } from "react";
import "./TaskManagement.css";
import CreateTaskModal from "./CreateTaskModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function TaskManagement() {
  const [emsTaskFilter, setEmsTaskFilter] = useState("All");
  const [emsTaskShowPopup, setEmsTaskShowPopup] = useState(false);
  const [emsTaskSelected, setEmsTaskSelected] = useState(null);
  const [emsTaskData, setEmsTaskData] = useState([]);
  const [viewTask, setViewTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  /* ================= NORMALIZE STATUS ================= */
  const normalizeStatus = (status) => {
    if (!status) return "ToDo";

    const clean = status.toString().toLowerCase().replace(/\s/g, "");

    if (clean.includes("todo")) return "ToDo";
    if (clean.includes("inprogress")) return "InProgress";
    if (clean.includes("completed")) return "Completed";
    if (clean.includes("overdue")) return "Overdue";

    return "ToDo";
  };

  /* ================= FETCH TASKS ================= */

  const fetchTasks = async (showToast = false) => {
    try {
      const res = await api.get(API_ENDPOINTS.tasks.list);

      const data = res.data;

      const formatted = data.map(task => ({
        emsTaskId: task.id ?? task.Id,
        emsTaskTitle: task.taskTitle ?? task.TaskTitle,
        emsTaskUser: task.assignedTo ?? task.AssignedTo,
        emsTaskProject: task.project ?? task.Project,
        emsTaskDescription: task.description ?? task.Description,
        emsTaskPriority: task.priority ?? task.Priority,
        emsTaskDue: task.dueDate ?? task.DueDate,
        emsTaskState: normalizeStatus(task.status ?? task.Status)
      }));

      setEmsTaskData(formatted);

      if (showToast) {
        // toast.success("Tasks loaded successfully");
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Something went wrong while fetching tasks");
    }
  };

  useEffect(() => {
    fetchTasks(true);
  }, []);

  /* ================= DELETE TASK ================= */

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(API_ENDPOINTS.tasks.byId(id));

      setEmsTaskSelected(null);
      setDeleteTaskId(null);
      toast.success("Task deleted successfully");
      fetchTasks();

    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Something went wrong while deleting task");
    }
  };

  /* ================= FILTER ================= */

  const emsFilteredTaskData =
    emsTaskFilter === "All"
      ? emsTaskData
      : emsTaskData.filter(
          task =>
            task.emsTaskState.toLowerCase() ===
            emsTaskFilter.toLowerCase()
        );

  return (
    <div className="ems-task-page-wrapper">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* HEADER */}
      <div className="ems-task-header-wrapper">
        <div>
          <h2>Task Management</h2>
          <p>Create, assign and monitor tasks</p>
        </div>

        <button
          className="ems-task-create-action-button"
          onClick={() => {
            setEmsTaskSelected(null);
            setEmsTaskShowPopup(true);
          }}
        >
          + Create Task
        </button>
      </div>

      {/* SUMMARY */}
      <div className="ems-task-summary-card-container">
        <div className="ems-task-summary-single-card">
          To Do{" "}
          <span>
            {emsTaskData.filter(
              t => t.emsTaskState.toLowerCase() === "todo"
            ).length}
          </span>
        </div>

        <div className="ems-task-summary-single-card">
          In Progress{" "}
          <span>
            {emsTaskData.filter(
              t => t.emsTaskState.toLowerCase() === "inprogress"
            ).length}
          </span>
        </div>

        <div className="ems-task-summary-single-card">
          Completed{" "}
          <span>
            {emsTaskData.filter(
              t => t.emsTaskState.toLowerCase() === "completed"
            ).length}
          </span>
        </div>

        <div className="ems-task-summary-single-card ems-task-summary-overdue-card">
          Overdue{" "}
          <span>
            {emsTaskData.filter(
              t => t.emsTaskState.toLowerCase() === "overdue"
            ).length}
          </span>
        </div>
      </div>

      {/* FILTER */}
      <div className="ems-task-filter-tab-container">
        {["All", "ToDo", "InProgress", "Completed", "Overdue"].map(tab => (
          <button
            key={tab}
            className={
              emsTaskFilter === tab
                ? "ems-task-filter-tab-button ems-task-filter-active-button"
                : "ems-task-filter-tab-button"
            }
            onClick={() => setEmsTaskFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="ems-task-data-table-outer-wrapper">
        <div className="ems-task-horizontal-scroll-wrapper">
          <table className="ems-task-data-main-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assignee</th>
                <th>Project</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {emsFilteredTaskData.map(task => (
                <tr key={task.emsTaskId}>
                  <td>{task.emsTaskTitle}</td>
                  <td>{task.emsTaskUser}</td>
                  <td>{task.emsTaskProject}</td>

                  <td onClick={() => setViewTask(task)} style={{ cursor: "pointer" }}>
                    {task.emsTaskDescription}
                  </td>

                  <td>
                    <span className={`ems-task-priority-pill ems-task-priority-${(task.emsTaskPriority || "").toLowerCase()}`}>
                      {task.emsTaskPriority}
                    </span>
                  </td>

                  <td>
                    {new Date(task.emsTaskDue).toLocaleDateString()}
                  </td>

                  <td>
                    <span className={`ems-task-state-pill ems-task-state-${task.emsTaskState.toLowerCase()}`}>
                      {task.emsTaskState}
                    </span>
                  </td>

                  <td>
                    <button
                      className="ems-task-edit-btn"
                      onClick={() => {
                        setEmsTaskSelected(task);
                        setEmsTaskShowPopup(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="ems-task-delete-btn"
                      onClick={() => setDeleteTaskId(task.emsTaskId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* VIEW TASK */}
      {viewTask && (
        <div className="ems-task-view-overlay" onClick={() => setViewTask(null)}>
          <div className="ems-task-view-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Task Details</h3>
            <p><strong>Task:</strong> {viewTask.emsTaskTitle}</p>
            <p><strong>Assignee:</strong> {viewTask.emsTaskUser}</p>
            <p><strong>Project:</strong> {viewTask.emsTaskProject}</p>

            <p><strong>Description:</strong></p>
            <div className="ems-task-full-desc">
              {viewTask.emsTaskDescription}
            </div>

            <button onClick={() => setViewTask(null)}>Close</button>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteTaskId && (
        <div className="ems-task-delete-overlay" onClick={() => setDeleteTaskId(null)}>
          <div className="ems-task-delete-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Task</h3>
            <p>Are you sure you want to delete this task?</p>

            <div className="ems-task-delete-actions">
              <button
                className="ems-task-cancel-delete-btn"
                onClick={() => setDeleteTaskId(null)}
              >
                Cancel
              </button>

              <button
                className="ems-task-confirm-delete-btn"
                onClick={() => handleDeleteTask(deleteTaskId)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE */}
      {emsTaskShowPopup && (
        <CreateTaskModal
          editData={emsTaskSelected}
          emsTaskClosePopup={() => {
            setEmsTaskShowPopup(false);
            setEmsTaskSelected(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}

export default TaskManagement;
