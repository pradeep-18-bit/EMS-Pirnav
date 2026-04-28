import React, { useState, useEffect } from "react";
import "./OfferLetters.css";
import {
  FaFileAlt,
  FaDownload,
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBriefcase,
  FaRupeeSign,
  FaCalendarAlt
} from "react-icons/fa";
import api from "../api/axiosInstance";
import { API_ENDPOINTS } from "../api/endpoints";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function OfferLetters() {
  const [formData, setFormData] = useState({
    candidate_Name: "",
    email: "",
    address: "",
    position: "",
    joining_Date: "",
    ctc_Annual: ""
  });

  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  /* ===== PAGINATION ===== */
  const [currentPage, setCurrentPage] = useState(1);
  const lettersPerPage = 50;

  const indexOfLast = currentPage * lettersPerPage;
  const indexOfFirst = indexOfLast - lettersPerPage;
  const currentLetters = letters.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(letters.length / lettersPerPage);

  /* ================= TOKEN ================= */
  const getToken = () => {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token")
    );
  };

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ only allow digits in CTC
    if (name === "ctc_Annual") {
      const numericValue = value.replace(/\D/g, "");

      // Format in Indian style (3,00,000)
      const formattedValue = new Intl.NumberFormat("en-IN").format(numericValue);

      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /* ================= FETCH OFFER LETTERS ================= */
  const fetchOfferLetters = async () => {
    try {
      const token = getToken();

      if (!token) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
        return;
      }

      const res = await api.get(API_ENDPOINTS.offerLetters.all, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setLetters(data);

      const newTotalPages = Math.ceil(data.length / lettersPerPage) || 1;
      if (currentPage > newTotalPages) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to fetch offer letters");
    }
  };

  useEffect(() => {
    fetchOfferLetters();
  }, []);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    if (!formData.candidate_Name.trim()) {
      toast.warning("Candidate name is required");
      return false;
    }

    if (!formData.email.trim()) {
      toast.warning("Email is required");
      return false;
    }

    if (!formData.address.trim()) {
      toast.warning("Address is required");
      return false;
    }

    if (!formData.position.trim()) {
      toast.warning("Position is required");
      return false;
    }

    if (!formData.joining_Date) {
      toast.warning("Joining date is required");
      return false;
    }

    if (!formData.ctc_Annual || Number(formData.ctc_Annual) <= 0) {
      toast.warning("Please enter valid annual CTC");
      return false;
    }

    return true;
  };

  /* ================= GENERATE OFFER LETTER ================= */
  const handleGenerate = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const token = getToken();
      if (!token) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
        return;
      }

      const payload = {
        candidate_Name: formData.candidate_Name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        position: formData.position.trim(),
        joining_Date: formData.joining_Date,
        ctc_Annual: Number(formData.ctc_Annual.replace(/,/g, ""))
      };

      console.log("Payload:", payload);

      await api.post(API_ENDPOINTS.offerLetters.generate, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      toast.success("Offer Letter Generated Successfully");

      setFormData({
        candidate_Name: "",
        email: "",
        address: "",
        position: "",
        joining_Date: "",
        ctc_Annual: ""
      });

      fetchOfferLetters();
    } catch (error) {
      console.error("Generate Error:", error);

      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      } else {
        toast.error("Failed to generate offer letter");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= DOWNLOAD LETTER ================= */
  const handleDownload = async (id) => {
    try {
      const token = getToken();

      if (!token) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
        return;
      }

      setDownloadingId(id);

      const response = await api.get(API_ENDPOINTS.offerLetters.download(id), {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const file = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = `OfferLetter_${id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Offer Letter Downloaded");
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="offer-container">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="offer-header">
        <h2>
          <FaFileAlt /> Offer Letter Generation
        </h2>
        <p>Generate offer letters for new hires</p>
      </div>

      <div className="offer-card">
        <h3>Generate New Offer Letter</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>
              <FaUser /> Candidate Name
            </label>
            <input
              type="text"
              name="candidate_Name"
              value={formData.candidate_Name}
              onChange={handleChange}
              placeholder="Enter candidate name"
            />
          </div>

          <div className="form-group">
            <label>
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
          </div>

          <div className="form-group full-width">
            <label>
              <FaMapMarkerAlt /> Address
            </label>
            <textarea
              name="address"
              rows="4"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
            />
          </div>

          <div className="form-group">
            <label>
              <FaBriefcase /> Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Enter position"
            />
          </div>

          <div className="form-group">
            <label>
              <FaRupeeSign /> Annual CTC
            </label>
            <input
              type="text"
              name="ctc_Annual"
              className="no-spinner"
              value={formData.ctc_Annual}
              onChange={handleChange}
              placeholder="Enter annual CTC"
              inputMode="numeric"
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div className="form-group">
            <label>
              <FaCalendarAlt /> Joining Date
            </label>
            <input
              type="date"
              name="joining_Date"
              value={formData.joining_Date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="offer-buttons">
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            <FaFileAlt />
            {loading ? " Generating..." : " Generate Letter"}
          </button>
        </div>
      </div>

      <div className="offer-list">
        <h3>
          <FaFileAlt /> Generated Offer Letters
        </h3>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>
                  <FaUser /> Candidate
                </th>
                <th>
                  <FaEnvelope /> Email
                </th>
                <th>
                  <FaBriefcase /> Position
                </th>
                <th>
                  <FaDownload /> Download
                </th>
              </tr>
            </thead>

            <tbody>
              {currentLetters.length > 0 ? (
                currentLetters.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.candidate_Name}</td>
                    <td>{item.email}</td>
                    <td>{item.position}</td>

                    <td>
                      <button
                        className="download-btn"
                        onClick={() => handleDownload(item.id)}
                        disabled={downloadingId === item.id}
                      >
                        <FaDownload />
                        {downloadingId === item.id
                          ? " Downloading..."
                          : " Download"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No offer letters found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="assets-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
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
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OfferLetters;
