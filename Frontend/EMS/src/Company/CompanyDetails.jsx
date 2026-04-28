import React, { useState, useEffect } from "react";
import "./CompanyDetails.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";

function CompanyDetails() {

    const [modalType, setModalType] = useState(null);

    // 🔥 ADDED POPUP STATE
    const [showBranchPopup, setShowBranchPopup] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchEditIndex, setBranchEditIndex] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    /* ================= COMPANY STATE ================= */
    const [company, setCompany] = useState({});
    const companyId = 1; // change if needed
    /* ================= BRANCH LIST ================= */
    const [branches, setBranches] = useState([
        {
            name: "Chennai Head Office",
            established: "June 12, 2015",
            phone: "+91 44 2233 4455",
            email: "chennai@techcorp.com",
            gst: "33ABCDE1234F1Z5",
            tin: "TIN9988776655",
            pan: "ABCDE1234F"
        },
        {
            name: "Bangalore Tech Park",
            established: "March 20, 2018",
            phone: "+91 80 4455 6677",
            email: "bangalore@techcorp.com",
            gst: "29ABCDE1234F1Z5",
            tin: "TIN1122334455",
            pan: "ABCDE5678G"
        }
    ]);

    /* ================= BRANCH FORM ================= */
    const [branch, setBranch] = useState({
        name: "",
        established: "",
        phone: "",
        email: "",
        gst: "",
        tin: "",
        pan: ""
    });

    const fetchCompany = async () => {
        try {
            const res = await api.get(
                API_ENDPOINTS.company.getById(companyId)
            );

            console.log("Company API:", res.data); // 🔥 ADD THIS

            const data = res.data;

            setCompany({
                name: data.companyName || "-",
                established: data.establishedDate?.split("T")[0] || "-",
                phone: data.phoneNumber || "-",
                email: data.emailAddress || "-",
                gst: data.gstNumber || "-",
                tin: data.tinNumber || "-",
                pan: data.panNumber || "-",
                branches: 0 // temporary
            });

        } catch (err) {
            console.error("Company fetch error FULL:", err);
            console.error("Error response:", err.response);
            console.error("Error data:", err.response?.data);
            console.error("Error status:", err.response?.status);

            // 🔥 fallback UI (IMPORTANT)
            setCompany({
                name: "No Data",
                established: "-",
                phone: "-",
                email: "-",
                gst: "-",
                tin: "-",
                pan: "-",
                branches: 0
            });
        }
    };

    useEffect(() => {

        const fetchBranches = async () => {

            try {

                const res = await api.get(API_ENDPOINTS.company.branches.list);

                const branchData = Array.isArray(res.data)
                    ? res.data
                    : res.data.data || [];

                const mappedBranches = branchData.map(b => ({
                    id: b.id,
                    name: b.branchName || "",
                    established: b.established
                        ? b.established.split("T")[0]
                        : "",
                    phone: b.phoneNumber || "",
                    email: b.email || ""
                }));

                setBranches(mappedBranches);

                setCompany(prev => ({
                    ...prev,
                    branches: mappedBranches.length,
                    branchList: mappedBranches   // ✅ ADD THIS
                }));

            } catch (error) {
                console.error("Branches fetch error:", error);
            }

        };
        fetchCompany();
        fetchBranches();

    }, []);

    const handleCompanyChange = (e) => {
        setCompany({
            ...company,
            [e.target.name]: e.target.value
        });
    };

    const handleBranchChange = (e) => {
        setBranch({
            ...branch,
            [e.target.name]: e.target.value
        });
    };

    const handleAddBranch = async () => {

        if (!branch.name) return;

        try {

            const payload = {
                branchName: branch.name,
                established: branch.established
                    ? new Date(branch.established).toISOString()
                    : null,
                phoneNumber: branch.phone,
                email: branch.email
            };

            // EDIT
            if (branchEditIndex !== null) {

                await api.put(
                    API_ENDPOINTS.company.branches.byId(branches[branchEditIndex].id),
                    payload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        }
                    }
                );

            }
            // ADD
            else {

                await api.post(
                    API_ENDPOINTS.company.branches.list,
                    payload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        }
                    }
                );

            }

            // Refresh branches
            const res = await api.get(API_ENDPOINTS.company.branches.list);

            const branchData = Array.isArray(res.data)
                ? res.data
                : res.data.data || [];

            const mappedBranches = branchData.map(b => ({
                id: b.id,
                name: b.branchName || "",
                established: b.established ? b.established.split("T")[0] : "",
                phone: b.phoneNumber || "",
                email: b.email || ""
            }));

            setBranches(mappedBranches);

            setCompany(prev => ({
                ...prev,
                branches: mappedBranches.length
            }));

            setBranch({
                name: "",
                established: "",
                phone: "",
                email: ""
            });

            setBranchEditIndex(null);
            setModalType(null);

        } catch (error) {
            console.error("Branch Save Error:", error.response?.data || error.message);
        }

    };
    // 🔥 ADDED ROW CLICK FUNCTION
    const openBranchPopup = (b) => {
        setSelectedBranch(b);
        setShowBranchPopup(true);
    };
    const handleBranchEdit = () => {

        const index = branches.findIndex(b => b.id === selectedBranch.id);

        setBranch(selectedBranch);
        setBranchEditIndex(index);

        setShowBranchPopup(false);
        setModalType("branch");

    };
    const handleDeleteBranch = async () => {

        if (!selectedBranch) return;

        try {

            await api.delete(API_ENDPOINTS.company.branches.byId(selectedBranch.id));

            const updatedBranches = branches.filter(b => b.id !== selectedBranch.id);

            setBranches(updatedBranches);

            setCompany(prev => ({
                ...prev,
                branches: updatedBranches.length
            }));

            setShowDeleteModal(false);
            setSelectedBranch(null);

        } catch (error) {
            console.error("Delete Error:", error.response?.data || error.message);
        }
    };

    const updateCompany = async () => {
        try {

            const payload = {
                companyName: company.name,
                establishedDate: company.established
                    ? new Date(company.established).toISOString()
                    : null,
                phoneNumber: company.phone,
                emailAddress: company.email,
                gstNumber: company.gst,
                tinNumber: company.tin,
                panNumber: company.pan,
                branches: data.totalBranches || 0,

                // ✅ ADD THIS
                branchList: []
            };

            console.log("UPDATE PAYLOAD:", payload);

            await api.put(
                API_ENDPOINTS.company.update(companyId),
                payload
            );

            console.log("Company updated successfully");

            setModalType(null);

            // refresh
            fetchCompany();

        } catch (error) {
            console.error("Update error:", error.response?.data || error.message);
        }
    };

    return (
        <div className="company-page">

            <div className="company-card">
                <div className="company-header">
                    <div>
                        <h2>{company.name}</h2>
                        <p>Established: {company.established}</p>
                    </div>

                    <button
                        className="edit-btn"
                        onClick={() => setModalType("company")}
                    >
                        Edit Details
                    </button>
                </div>

                <div className="company-info">
                    <div className="info-box">📞 {company.phone}</div>
                    <div className="info-box">✉️ {company.email}</div>
                    <div className="info-box">GST: {company.gst}</div>
                    <div className="info-box">TIN: {company.tin}</div>
                    <div className="info-box">PAN: {company.pan}</div>
                    <div className="info-box">Branches: {branches.length}</div>
                </div>
            </div>

            <div className="branch-header">
                <h3>Branches</h3>
                <button
                    className="company-add-btn"
                    onClick={() => setModalType("branch")}
                >
                    + Add Branch
                </button>
            </div>

            {/* ================= BRANCH TABLE ================= */}


            <table className="branch-table">

                <thead>
                    <tr>
                        <th>Branch Name</th>
                        <th>Established</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>

                    {branches.map((b, i) => (
                        <tr key={i} className="branch-row-click">

                            <td>{b.name}</td>
                            <td>{b.established}</td>
                            <td>{b.phone}</td>
                            <td>{b.email}</td>

                            <td>

                                <div style={{ display: "flex", gap: "8px" }}>

                                    <button
                                        className="company-edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBranch(b);
                                            handleBranchEdit();
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="company-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBranch(b);
                                            setShowDeleteModal(true);
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
            {showDeleteModal && (
                <div className="company-modal-overlay">
                    <div className="company-modal-box small">

                        <h3>Confirm Delete</h3>

                        <p style={{ marginTop: "10px" }}>
                            Are you sure you want to delete this branch?
                        </p>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                                marginTop: "20px"
                            }}
                        >

                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#ccc",
                                    border: "none",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    marginRight: "10px"
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="company-delete-btn"
                                onClick={handleDeleteBranch}
                            >
                                Yes, Delete
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* 🔥 ROW DETAILS POPUP */}
            {showBranchPopup && selectedBranch && (
                <div className="company-modal-overlay">
                    <div className="company-modal-box small">

                        <h3>Branch Details</h3>

                        <div className="branch-details">
                            <p><strong>Name :</strong> {selectedBranch.name}</p>
                            <p><strong>Established :</strong> {selectedBranch.established}</p>
                            <p><strong>Phone :</strong> {selectedBranch.phone}</p>
                            <p><strong>Email :</strong> {selectedBranch.email}</p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                                marginTop: "15px"
                            }}
                        >

                            <button
                                className="company-edit-btn"
                                onClick={handleBranchEdit}
                            >
                                Edit
                            </button>

                            <button
                                className="company-delete-btn"
                                onClick={handleDeleteBranch}
                            >
                                Delete
                            </button>

                            <button
                                className="company-cancel-btn"
                                onClick={() => setShowBranchPopup(false)}
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* YOUR EXISTING MODALS BELOW (UNCHANGED) */}

            {modalType === "company" && (
                <div className="company-modal-overlay">
                    <div className="company-modal-box">
                        <h3>Edit Company Details</h3>

                        <div className="form-two-column">

                            {/* LEFT COLUMN */}
                            <div className="form-column">

                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input
                                        name="name"
                                        value={company.name}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        name="phone"
                                        value={company.phone}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input
                                        name="gst"
                                        value={company.gst}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>PAN Number</label>
                                    <input
                                        name="pan"
                                        value={company.pan}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                            </div>


                            {/* RIGHT COLUMN */}
                            <div className="form-column">

                                <div className="form-group">
                                    <label>Established Date</label>
                                    <input
                                        name="established"
                                        value={company.established}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        name="email"
                                        value={company.email}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>TIN Number</label>
                                    <input
                                        name="tin"
                                        value={company.tin}
                                        onChange={handleCompanyChange}
                                    />
                                </div>

                                {/* <div className="form-group">
                                    <label>Total Branches</label>
                                    <input
                                        name="branches"
                                        value={company.branches}
                                        onChange={handleCompanyChange}
                                    />
                                </div> */}

                            </div>

                        </div>

                        <div className="company-modal-btns">
                            <button
                                className="company-cancel-btn"
                                onClick={() => setModalType(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="company-save-btn"
                                onClick={updateCompany}
                            >
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {modalType === "branch" && (
                <div className="company-modal-overlay">
                    <div className="company-modal-box">
                        <h3>{branchEditIndex !== null ? "Edit Branch Details" : "Add Branch Details"}</h3>

                        <input name="name" value={branch.name}
                            onChange={handleBranchChange} placeholder="Branch Name" />

                        <input name="established" value={branch.established}
                            onChange={handleBranchChange} placeholder="Established" />

                        <input name="phone" value={branch.phone}
                            onChange={handleBranchChange} placeholder="Phone Number" />

                        <input name="email" value={branch.email}
                            onChange={handleBranchChange} placeholder="Email" />

                        <div className="company-modal-btns">
                            <button
                                className="company-cancel-btn"
                                onClick={() => setModalType(null)}
                            >
                                Cancel
                            </button>
                            <button className="company-save-btn" onClick={handleAddBranch}>
                                {branchEditIndex !== null ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default CompanyDetails;
