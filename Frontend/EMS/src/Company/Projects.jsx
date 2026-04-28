import React, { useState, useEffect } from "react";
import "./Projects.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function Projects() {
    const [clients, setClients] = useState([]);
    const [projectsShowModal, setProjectsShowModal] = useState(false);
    const [projectsEditMode, setProjectsEditMode] = useState(false);

    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    const [projectsList, setProjectsList] = useState([]);

    const [projectsForm, setProjectsForm] = useState({
        name: "",
        id: "",
        client: "",
        startDate: "",
        endDate: "",
        team: "",
        status: ""
    });

    /* ================= FETCH PROJECTS ================= */

    const fetchProjects = async () => {
        try {
            const res = await api.get(API_ENDPOINTS.company.projects.list);

            const data = res.data;

            const formatted = data.map(p => {
                const clientObj = clients.find(c => c.id === p.clientId);

                return {
                    name: p.project_Name,
                    id: p.project_Id,
                    client: p.client || clientObj?.client_Name || "-",  // 🔥 FIX
                    startDate: p.start_Date ? p.start_Date.split("T")[0] : "",
                    endDate: p.end_Date ? p.end_Date.split("T")[0] : "",
                    team: p.team_Members,
                    status: p.status
                };
            });

            setProjectsList(formatted);

        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    // FETCH CLIENTS FOR DROPDOWN---------------------------
    const fetchClients = async () => {
        try {
            const res = await api.get(API_ENDPOINTS.masters.clients.list);

            const data = res.data;
            setClients(data);

        } catch (error) {
            console.error("Client fetch error:", error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchClients();
    }, []);




    /* ================= HANDLE INPUT ================= */

    const handleProjectsChange = (e) => {
        setProjectsForm({
            ...projectsForm,
            [e.target.name]: e.target.value
        });
    };

    /* ================= SAVE (ADD / EDIT) ================= */

    const handleSaveProject = async () => {
        if (!projectsForm.name || !projectsForm.id) return;

        const selectedClient = clients.find(
            (c) => c.client_Name === projectsForm.client
        );

        const payload = {
            project_Name: projectsForm.name,
            project_Id: projectsForm.id,
            client: projectsForm.client,
            clientId: selectedClient?.id || 0,   // 🔥 ADD THIS
            start_Date: projectsForm.startDate
                ? new Date(projectsForm.startDate).toISOString()
                : null,
            end_Date: projectsForm.endDate
                ? new Date(projectsForm.endDate).toISOString()
                : null,
            team_Members: projectsForm.team,
            status: projectsForm.status
        };

        try {
            let response;

            if (projectsEditMode) {
                await api.put(
                    API_ENDPOINTS.company.projects.byId(projectsForm.id),
                    payload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        }
                    }
                );
            } else {
                await api.post(API_ENDPOINTS.company.projects.list, payload, {
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
            }

            setProjectsShowModal(false);
            setProjectsEditMode(false);
            resetForm();
            fetchProjects();

        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    /* ================= DELETE ================= */

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            await api.delete(API_ENDPOINTS.company.projects.byId(projectToDelete));

            setShowDeletePopup(false);
            setProjectToDelete(null);
            fetchProjects();

        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    /* ================= EDIT ================= */

    const handleProjectsEdit = (project) => {
        setProjectsForm(project);
        setProjectsEditMode(true);
        setProjectsShowModal(true);
    };

    /* ================= RESET ================= */

    const resetForm = () => {
        setProjectsForm({
            name: "",
            id: "",
            client: "",
            startDate: "",
            endDate: "",
            team: "",
            status: ""
        });
    };

    /* ================= UI ================= */

    return (
        <div className="projects-page">

            <div className="projects-header">
                <div>
                    <h2>Projects</h2>
                    <p>Manage company projects and assignments</p>
                </div>

                <button
                    className="projects-add-btn"
                    onClick={() => {
                        resetForm();
                        setProjectsEditMode(false);
                        setProjectsShowModal(true);
                    }}
                >
                    + New Project
                </button>
            </div>

            <div className="projects-table-wrapper">
                <table className="projects-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Client</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Team</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {projectsList.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <strong>{p.name}</strong><br />
                                    <span>{p.id}</span>
                                </td>
                                <td>{p.client}</td>
                                <td>{p.startDate}</td>
                                <td>{p.endDate}</td>
                                <td>{p.team}</td>
                                <td>{p.status}</td>

                                <td>
                                    <div className="projects-action-cell">

                                        <button
                                            onClick={() => handleProjectsEdit(p)}
                                            style={{
                                                backgroundColor: "#3b82f6",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "6px 14px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                fontWeight: "500"
                                            }}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="projects-delete-btn"
                                            onClick={() => {
                                                setProjectToDelete(p.id);
                                                setShowDeletePopup(true);
                                            }}
                                        >
                                            Delete
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ADD / EDIT MODAL */}
            {projectsShowModal && (
                <div className="projects-modal-overlay">
                    <div className="projects-modal">

                        <h3>{projectsEditMode ? "Edit Project" : "Add Project"}</h3>

                        <input name="name" value={projectsForm.name} onChange={handleProjectsChange} placeholder="Project Name" />
                        <input name="id" value={projectsForm.id} onChange={handleProjectsChange} placeholder="Project ID" />
                        <select
                            name="client"
                            value={projectsForm.client}
                            onChange={handleProjectsChange}
                        >
                            <option value="">Select Client</option>

                            {clients.map((c) => (
                                <option key={c.id} value={c.client_Name}>
                                    {c.client_Name}
                                </option>
                            ))}

                        </select>
                        <input type="date" name="startDate" value={projectsForm.startDate} onChange={handleProjectsChange} />
                        <input type="date" name="endDate" value={projectsForm.endDate} onChange={handleProjectsChange} />
                        <input name="team" value={projectsForm.team} onChange={handleProjectsChange} placeholder="Team Members" />

                        <select name="status" value={projectsForm.status} onChange={handleProjectsChange}>
                            <option value="">Select Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Planning">Planning</option>
                            <option value="Hold">Hold</option>
                        </select>

                        <div className="projects-modal-btns">
                            <button
                                className="projects-edit-btn"
                                onClick={() => setProjectsShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button className="projects-save-btn" onClick={handleSaveProject}>
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION POPUP */}
            {showDeletePopup && (
                <div className="projects-modal-overlay">
                    <div className="projects-modal small">
                        <h3>Confirm Delete</h3>
                        <p style={{ margin: "15px 0" }}>
                            Are you sure you want to delete this project?
                        </p>

                        <div className="projects-modal-btns">
                            <button
                                className="projects-edit-btn"
                                onClick={() => setShowDeletePopup(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="projects-delete-btn"
                                onClick={confirmDeleteProject}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Projects;

