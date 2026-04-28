import React, { useState, useEffect } from "react";
import "./Assets.css";
import api from "../api/axiosInstance";
import { API_ENDPOINTS, buildServerUrl } from "../api/endpoints";

export default function Assets() {

  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const assetsPerPage = 50;

  const [previewImages, setPreviewImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const [newAsset, setNewAsset] = useState({
    name: "",
    serial: "",
    assigned: "",
    status: "Assigned",
    images: []
  });

  const [errors, setErrors] = useState({});

  /* ================= FETCH ASSETS ================= */

  const fetchAssets = async () => {

    try {

      const res = await api.get(API_ENDPOINTS.masters.assets.list);

      const data = res.data;

      if (!Array.isArray(data)) {
        setAssets([]);
        return;
      }

      const formatted = data.map((item) => ({
        assetId:
          item.assetId ??
          item.AssetId ??
          item.assetID ??
          item.id ??
          item.Id ??
          null,

        assetName: item.assetName ?? item.AssetName ?? "",
        serialNo: item.serialNo ?? item.SerialNo ?? "",
        assignedTo: item.assignedTo ?? item.AssignedTo ?? "",
        status: item.status ?? item.Status ?? "",

        images: Array.isArray(item.imagePaths)
          ? item.imagePaths
          : typeof item.imagePaths === "string"
            ? item.imagePaths.split(",")
            : []
      }));

      setAssets(formatted);

    } catch (err) {
      console.error("Error fetching assets:", err);
    }

  };

  useEffect(() => {
    fetchAssets();
  }, []);

  /* ================= HANDLE INPUT ================= */

  const handleChange = (e) => {

    setNewAsset({
      ...newAsset,
      [e.target.name]: e.target.value
    });

  };

  /* ================= HANDLE IMAGE ================= */

  const handleImageChange = (e) => {

    const files = Array.from(e.target.files);

    setNewAsset({
      ...newAsset,
      images: files
    });

    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);

  };

  /* ================= VALIDATION ================= */

  const validateForm = () => {

    const newErrors = {};

    if (!newAsset.name.trim()) {
      newErrors.name = "Asset name is required";
    }

    if (!newAsset.serial.trim()) {
      newErrors.serial = "Serial number is required";
    } else if (newAsset.serial.length < 5) {
      newErrors.serial = "Serial number must be at least 5 characters";
    }

    if (newAsset.status === "Assigned" && !newAsset.assigned.trim()) {
      newErrors.assigned = "Assigned To is required when status is Assigned";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async () => {

    if (!validateForm()) return;

    // 🔹 Check duplicate serial number
    const duplicate = assets.find(
      (a) =>
        a.serialNo?.toLowerCase() === newAsset.serial.toLowerCase() &&
        a.assetId !== editId
    );

    if (duplicate) {
      alert("Serial number already exists. Please enter a unique serial number.");
      return;
    }

    try {

      const formData = new FormData();

      formData.append("AssetName", newAsset.name);
      formData.append("SerialNo", newAsset.serial);
      formData.append("AssignedTo", newAsset.assigned);
      formData.append("Status", newAsset.status);

      newAsset.images.forEach((img) => {
        formData.append("Images", img);
      });

      let response;

      if (editId) {
        response = await api.put(
          API_ENDPOINTS.masters.assets.byId(editId),
          formData
        );
      } else {
        response = await api.post(API_ENDPOINTS.masters.assets.list, formData);
      }

      closeForm();
      fetchAssets();

    } catch (error) {
      console.error("Error saving asset:", error);
    }

  };

  /* ================= EDIT ================= */

  const handleEdit = (asset) => {

    setEditId(asset.assetId);

    setNewAsset({
      name: asset.assetName,
      serial: asset.serialNo,
      assigned: asset.assignedTo,
      status: asset.status,
      images: []
    });

    setPreviewImages(asset.images || []);

    setShowForm(true);

  };

  /* ================= DELETE ================= */

  const confirmDeleteAsset = async () => {

    if (!assetToDelete) return;

    try {

      await api.delete(API_ENDPOINTS.masters.assets.byId(assetToDelete));

      setShowDeletePopup(false);
      setAssetToDelete(null);
      fetchAssets();

    } catch (error) {
      console.error("Error deleting asset:", error);
    }

  };

  /* ================= RESET FORM ================= */

  const closeForm = () => {

    setShowForm(false);
    setEditId(null);
    setErrors({});
    setPreviewImages([]);

    setNewAsset({
      name: "",
      serial: "",
      assigned: "",
      status: "Assigned",
      images: []
    });

  };

  /* ================= PAGINATION ================= */

  const indexOfLast = currentPage * assetsPerPage;
  const indexOfFirst = indexOfLast - assetsPerPage;

  const currentAssets = assets.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(assets.length / assetsPerPage);

  /* ================= UI ================= */

  return (

    <div className="assets-page">

      <div className="assets-header">

        <div>
          <h2>Asset Management</h2>
          <p>Track and manage company assets</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Add Asset
        </button>

      </div>

      <table className="assets-table">

        <thead>
          <tr>
            <th>Image</th>
            <th>Asset</th>
            <th>Serial No</th>
            <th>Employee Code</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {currentAssets.length > 0 ? (

            currentAssets.map((a) => (

              <tr key={a.assetId ?? a.serialNo}>
                <td>
                  {a.images && a.images.length > 0 ? (
                    <button
                      className="view-images-btn"
                      onClick={() => {
                        setSelectedImages(a.images);
                        setShowImageModal(true);
                      }}
                    >
                      View Images ({a.images.length})
                    </button>
                  ) : (
                    <span style={{ color: "#999" }}>No Image</span>
                  )}
                </td>

                <td>{a.assetName}</td>
                <td>{a.serialNo}</td>
                <td>{a.assignedTo}</td>

                <td>
                  <span
                    className={
                      a.status === "Assigned"
                        ? "badge assigned"
                        : a.status === "Available"
                          ? "badge available"
                          : "badge repair"
                    }
                  >
                    {a.status}
                  </span>
                </td>

                <td className="action-cell">
                  <div className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(a)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => {
                        setAssetToDelete(a.assetId);
                        setShowDeletePopup(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>

              </tr>

            ))

          ) : (

            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No assets found
              </td>
            </tr>

          )}

        </tbody>

      </table>

      {/* PAGINATION */}

      <div className="assets-pagination">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active-page" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>

      </div>

      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="modal">

          <div className="modal-content">

            <h3>{editId ? "Edit Asset" : "Add Asset"}</h3>

            <input
              type="text"
              name="name"
              placeholder="Asset Name"
              value={newAsset.name}
              onChange={handleChange}
            />

            {errors.name && <p className="asset-error">{errors.name}</p>}

            <input
              type="text"
              name="serial"
              placeholder="Serial No"
              value={newAsset.serial}
              onChange={handleChange}
            />

            {errors.serial && <p className="asset-error">{errors.serial}</p>}

            <input
              type="text"
              name="assigned"
              placeholder="Employee Code "
              value={newAsset.assigned}
              onChange={handleChange}
            />

            {errors.assigned && <p className="asset-error">{errors.assigned}</p>}

            <select
              name="status"
              value={newAsset.status}
              onChange={handleChange}
            >
              <option value="Assigned">Assigned</option>
              <option value="Available">Available</option>
              <option value="Under Repair">Under Repair</option>
            </select>

            {/* IMAGE FIELD */}

            <input
              type="file"
              multiple
              onChange={handleImageChange}
            />

            <div className="image-preview">
              {previewImages.map((img, index) =>
                img ? (
                  <img
                    key={index}
                    src={img}
                    alt="preview"
                    style={{ width: "60px", marginRight: "6px" }}
                  />
                ) : null
              )}
            </div>

            <div className="asset-modal-actions">

              <button
                className="asset-update-btn"
                onClick={handleSubmit}
              >
                {editId ? "Update" : "Save"}
              </button>

              <button
                type="button"
                className="asset-delete-cancel-btn"
                onClick={closeForm}
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE POPUP */}

      {showDeletePopup && (

        <div className="asset-delete-overlay">

          <div className="asset-delete-modal">

            <h3>Confirm Delete</h3>

            <p style={{ margin: "15px 0" }}>
              Are you sure you want to delete this asset?
            </p>

            <div className="asset-delete-actions">

              <button
                onClick={() => setShowDeletePopup(false)}
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
                className="asset-delete-btn"
                onClick={confirmDeleteAsset}
              >
                Yes, Delete
              </button>

            </div>

          </div>

        </div>

      )}
      {showImageModal && (
        <div className="image-modal-overlay">
          <div className="image-modal">

            <h3>Asset Images</h3>

            <div className="image-grid">
              {selectedImages.map((img, index) => (
                <a
                  key={index}
                  href={buildServerUrl(img)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={buildServerUrl(img)}
                    alt="asset"
                    style={{ cursor: "pointer" }}
                  />
                </a>
              ))}
            </div>

            <button
              className="close-image-btn"
              onClick={() => setShowImageModal(false)}
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>

  );

}
