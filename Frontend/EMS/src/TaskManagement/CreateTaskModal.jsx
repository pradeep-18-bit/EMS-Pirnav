import React, { useState, useEffect } from "react";
import "./TaskManagement.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";
 
function CreateTaskModal({ emsTaskClosePopup, editData }) {
 
  const [formData, setFormData] = useState({
    taskTitle: "",
    assignedTo: "",
    project: "",
    priority: "Medium",
    dueDate: "",
    description: ""
  });
 
  const [errors, setErrors] = useState({});
 
  /* ================= FIX: SYNC EDIT DATA ================= */
 
  useEffect(() => {
    if (editData) {
      setFormData({
        taskTitle: editData.emsTaskTitle || "",
        assignedTo: editData.emsTaskUser || "",
        project: editData.emsTaskProject || "",
        priority: editData.emsTaskPriority || "Medium",
        dueDate: editData.emsTaskDue
          ? new Date(editData.emsTaskDue).toISOString().split("T")[0]
          : "",
        description: editData.emsTaskDescription || ""
      });
    }
  }, [editData]);
 
  /* ================= HANDLE CHANGE ================= */
 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 
  /* ================= VALIDATION ================= */
 
  const validateForm = () => {
    const newErrors = {};
 
    if (!formData.taskTitle.trim())
      newErrors.taskTitle = "Task title is required";
 
    if (!formData.assignedTo.trim())
      newErrors.assignedTo = "Assignee is required";
 
    if (!formData.project.trim())
      newErrors.project = "Project is required";
 
    if (!formData.dueDate)
      newErrors.dueDate = "Due date is required";
 
    if (!formData.description.trim())
      newErrors.description = "Description is required";
 
    setErrors(newErrors);
 
    return Object.keys(newErrors).length === 0;
  };
 
  /* ================= SUBMIT ================= */
 
  const handleSubmit = async () => {
 
    if (!validateForm()) return;
 
    const payload = {
      taskTitle: formData.taskTitle,
      assignedTo: formData.assignedTo,
      project: formData.project,
      priority: formData.priority,
      dueDate: new Date(formData.dueDate).toISOString(),
      description: formData.description,
      status: editData?.emsTaskState || "ToDo"
    };
 
    try {
 
      // ✅ UPDATE
      if (editData) {
        await api.put(API_ENDPOINTS.tasks.byId(editData.emsTaskId), payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
 
      } else {
        // ✅ CREATE
        await api.post(API_ENDPOINTS.tasks.list, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
 
      emsTaskClosePopup(); // close modal after success
 
    } catch (error) {
      console.error("Submit failed:", error);
    }
  };
 
  return (
    <div className="ems-task-create-overlay">
 
      <div className="ems-task-create-popup">
 
        <h3>{editData ? "Edit Task" : "Create Task"}</h3>
 
        <input
          type="text"
          name="taskTitle"
          placeholder="Task Title"
          value={formData.taskTitle}
          onChange={handleChange}
        />
        {errors.taskTitle && <p className="task-error">{errors.taskTitle}</p>}
 
        <input
          type="text"
          name="assignedTo"
          placeholder="Assignee"
          value={formData.assignedTo}
          onChange={handleChange}
        />
        {errors.assignedTo && <p className="task-error">{errors.assignedTo}</p>}
 
        <input
          type="text"
          name="project"
          placeholder="Project"
          value={formData.project}
          onChange={handleChange}
        />
        {errors.project && <p className="task-error">{errors.project}</p>}
 
        <textarea
          type="text"
          name="description"
          placeholder="Task Description"
          value={formData.description}
          onChange={handleChange}
        />
        {errors.description && (
          <p className="task-error">{errors.description}</p>
        )}
 
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="Select">Select</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
 
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
        />
        {errors.dueDate && <p className="task-error">{errors.dueDate}</p>}
 
        <div className="ems-task-create-buttons">
          <button
            className="ems-task-submit-btn"
            onClick={handleSubmit}
          >
            {editData ? "Update" : "Create"}
          </button>
 
          <button
            className="ems-task-cancel-btn"
            onClick={emsTaskClosePopup}
          >
            Cancel
          </button>
        </div>
 
      </div>
 
    </div>
  );
}
 
export default CreateTaskModal;

 
