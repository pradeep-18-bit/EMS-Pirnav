import React, { useState, useEffect } from "react";
import "./Clients.css";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaEllipsisV } from "react-icons/fa";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function Clients() {

  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectCounts, setProjectCounts] = useState({});

  const [newClient, setNewClient] = useState({
    client_Name: "",
    description: "",
    location: "",
    phone: "",
    email: "",
    active_Projects: 0
  });

  useEffect(() => {
    api.get(API_ENDPOINTS.masters.clients.list)
      .then((res) => setClients(res.data))
      .catch(err => console.error("Fetch Error:", err));

    api.get(API_ENDPOINTS.company.projects.list)
      .then((res) => res.data)
      .then(data => {
        const allProjects = Array.isArray(data)
          ? data
          : data?.$values || [];

        const counts = {};
        allProjects.forEach(p => {
          if (!counts[p.client]) counts[p.client] = 0;
          counts[p.client]++;
        });

        setProjectCounts(counts);
      })
      .catch(err => console.error("Project Count Error:", err));

  }, []);

  const handleViewClient = async (index) => {

    const client = clients[index];

    setSelectedClient(client);
    setShowDrawer(true);

    try {
      const res = await api.get(API_ENDPOINTS.company.projects.list);

      const data = res.data;

      const allProjects = Array.isArray(data)
        ? data
        : data?.$values || [];

      const filteredProjects = allProjects.filter(
        (proj) => proj.client === client.client_Name
      );

      setProjects(filteredProjects);

    } catch (error) {
      console.error("Project fetch failed:", error);
      setProjects([]);
    }
  };

  const handleAddClient = async () => {

    if (!newClient.client_Name.trim()) {
      alert("Client name is required");
      return;
    }

    try {
      const response = await api.post(
        API_ENDPOINTS.masters.clients.list,
        {
          client_Name: newClient.client_Name,
          description: newClient.description,
          location: newClient.location,
          phone: newClient.phone,
          email: newClient.email
          // ❌ removed active_Projects (backend should handle)
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      const saved = response.data;

      // fallback if backend not returning object
      const newSavedClient = saved?.id ? saved : {
        ...newClient,
        id: Date.now()
      };

      setClients(prev => [...prev, newSavedClient]);

      closeModal();

    } catch (error) {
      console.error("Save Error:", error);
      alert("Error adding client");
    }
  };

  const handleUpdateClient = async () => {

    const clientToUpdate = clients[editIndex];

    await api.put(
      API_ENDPOINTS.masters.clients.byId(encodeURIComponent(clientToUpdate.client_Name)),
      newClient,
      {
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    const updatedList = [...clients];
    updatedList[editIndex] = { ...clientToUpdate, ...newClient };

    setClients(updatedList);
    closeModal();
  };

  const handleDelete = async (index) => {
    const client = clients[index];

    await api.delete(
      API_ENDPOINTS.masters.clients.byId(encodeURIComponent(client.client_Name))
    );

    setClients(prev => prev.filter((_, i) => i !== index));
    setMenuOpenIndex(null);
  };

  const handleEdit = (index) => {
    setNewClient(clients[index]);
    setEditIndex(index);
    setIsUpdate(true);
    setShowModal(true);
    setMenuOpenIndex(null);
  };

  const closeModal = () => {

    setShowModal(false);
    setIsUpdate(false);
    setEditIndex(null);

    setNewClient({
      client_Name: "",
      description: "",
      location: "",
      phone: "",
      email: "",
      active_Projects: 0
    });
  };

  return (
    <div className="clients-page">

      <div className="clients-header">
        <div>
          <h2>Clients</h2>
          <p>Manage client relationships</p>
        </div>

        <button
          className="add-client-btn"
          onClick={() => setShowModal(true)}
        >
          + Add Client
        </button>
      </div>

      <div className="clients-grid">

        {clients.map((client, index) => (

          <div className="client-card" key={client.id || index}>

            <div className="card-header">
              <div className="avatar">
                {client.client_Name?.substring(0, 2).toUpperCase()}
              </div>
              {/* <span className="client-id">{client.id}</span> */}

              <div className="menu-wrapper">
                <FaEllipsisV
                  className="menu-icon"
                  onClick={() =>
                    setMenuOpenIndex(menuOpenIndex === index ? null : index)
                  }
                />

                {menuOpenIndex === index && (
                  <div className="menu-dropdown">
                    <p onClick={() => handleEdit(index)}>Edit</p>
                    <p onClick={() => handleDelete(index)}>Delete</p>
                  </div>
                )}
              </div>
            </div>

            <h3 className="client-name">{client.client_Name}</h3>
            <p className="client-desc">{client.description}</p>

            <div className="client-info">
              <p><FaMapMarkerAlt /> {client.location}</p>
              <p><FaPhoneAlt /> {client.phone}</p>
              <p><FaEnvelope /> {client.email}</p>
            </div>

            <div className="card-divider"></div>

            <div className="card-footer">
              <span>{projectCounts[client.client_Name] || 0} active projects</span>

              <button
                className="view-link"
                onClick={() => handleViewClient(index)}
              >
                View ↗
              </button>
            </div>

          </div>
        ))}

      </div>

      {showDrawer && selectedClient && (
        <div className="client-view-overlay">
          <div className="client-view-modal">

            <div className="view-header">
              <div className="view-left">

                <div className="view-avatar">
                  {selectedClient.client_Name?.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <h2>{selectedClient.client_Name}</h2>
                  <p>{selectedClient.description}</p>
                </div>

              </div>

              <button
                className="view-close"
                onClick={() => setShowDrawer(false)}
              >
                ✕
              </button>
            </div>

            <div className="view-contact">
              <p><FaMapMarkerAlt /> {selectedClient.location}</p>
              <p><FaPhoneAlt /> {selectedClient.phone}</p>
              <p><FaEnvelope /> {selectedClient.email}</p>
            </div>

            <div className="view-projects">

              <h4>PROJECTS ({projects.length})</h4>

              <div className="project-list">

                {projects.length > 0 ? (
                  projects.map((proj, i) => (

                    <div className="project-card" key={i}>

                      <div>
                        <h5>{proj.project_Name}</h5>

                        <p>
                          {new Date(proj.start_Date).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="status active">
                        {proj.status}
                      </span>

                    </div>

                  ))
                ) : (
                  <p className="no-projects">No Projects Found</p>
                )}

              </div>

            </div>

          </div>
        </div>

      )}
      {/* ✅ ADD HERE */}
      {showModal && (
        <div className="clients-add-modal-overlay-unique">
          <div className="clients-add-modal-box-unique">

            <h3>{isUpdate ? "Update Client" : "Add Client"}</h3>

            <input
              className="clients-add-input-unique"
              type="text"
              placeholder="Client Name"
              value={newClient.client_Name}
              onChange={(e) =>
                setNewClient({ ...newClient, client_Name: e.target.value })
              }
            />

            <input
              className="clients-add-input-unique"
              type="text"
              placeholder="Description"
              value={newClient.description}
              onChange={(e) =>
                setNewClient({ ...newClient, description: e.target.value })
              }
            />

            <input
              className="clients-add-input-unique"
              type="text"
              placeholder="Location"
              value={newClient.location}
              onChange={(e) =>
                setNewClient({ ...newClient, location: e.target.value })
              }
            />

            <input
              className="clients-add-input-unique"
              type="text"
              placeholder="Phone"
              value={newClient.phone}
              onChange={(e) =>
                setNewClient({ ...newClient, phone: e.target.value })
              }
            />

            <input
              className="clients-add-input-unique"
              type="email"
              placeholder="Email"
              value={newClient.email}
              onChange={(e) =>
                setNewClient({ ...newClient, email: e.target.value })
              }
            />

            <div className="clients-add-actions-unique">
              <button
                className="clients-add-cancel-btn-unique"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="clients-add-save-btn-unique"
                onClick={isUpdate ? handleUpdateClient : handleAddClient}
              >
                {isUpdate ? "Update" : "Save"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
