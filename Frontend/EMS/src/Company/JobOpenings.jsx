import React, { useState } from "react";
import { FaBriefcase } from "react-icons/fa";
import "./JobOpenings.css";

function JobOpenings() {

  const [jobShowModal, setJobShowModal] = useState(false);

  const [jobList, setJobList] = useState([
    {
      title: "Senior React Developer",
      dept: "Engineering",
      exp: "5+ years",
      positions: "3",
      skills: "React, TypeScript, Node.js",
      status: "Open"
    },
    {
      title: "UI/UX Designer",
      dept: "Design",
      exp: "3+ years",
      positions: "2",
      skills: "Figma, Adobe XD, CSS",
      status: "Open"
    }
  ]);

  const [jobForm, setJobForm] = useState({
    title: "",
    dept: "",
    exp: "",
    positions: "",
    skills: "",
    status: ""
  });

  const handleJobChange = (e) => {
    setJobForm({
      ...jobForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAddJob = () => {

    if (!jobForm.title) return;

    setJobList([...jobList, jobForm]);
    setJobShowModal(false);

    setJobForm({
      title: "",
      dept: "",
      exp: "",
      positions: "",
      skills: "",
      status: ""
    });
  };

  const getJobStatusClass = (status) => {
    if (status === "Closed") return "job-badge job-closed";
    if (status === "On Hold") return "job-badge job-hold";
    return "job-badge job-open";
  };

  return (
    <div className="job-page-unique">

      <div className="job-header-unique">
        <div>
          <h2>Job Openings</h2>
          <p>Manage job postings and recruitment</p>
        </div>

        <button className="job-add-btn" onClick={() => setJobShowModal(true)}>
          + Post Job
        </button>
      </div>

      <div className="job-grid-unique">

        {jobList.map((job, i) => (
          <div className="job-card-unique" key={i}>

            <div className="job-top-unique">
              <div className="job-icon-unique">
                <FaBriefcase />
              </div>

              <span className={getJobStatusClass(job.status)}>
                {job.status}
              </span>
            </div>

            <h3>{job.title}</h3>
            <p className="job-dept-unique">{job.dept}</p>

            <p>Experience: {job.exp}</p>
            <p>Positions: {job.positions}</p>
            <p>Skills: {job.skills}</p>

          </div>
        ))}

      </div>

      {/* MODAL */}
      {jobShowModal && (
        <div className="job-modal-overlay">
          <div className="job-modal-box">

            <h3>Add Job</h3>

            <input name="title" value={jobForm.title} onChange={handleJobChange} placeholder="Job Title"/>
            <input name="dept" value={jobForm.dept} onChange={handleJobChange} placeholder="Department"/>
            <input name="exp" value={jobForm.exp} onChange={handleJobChange} placeholder="Experience"/>
            <input name="positions" value={jobForm.positions} onChange={handleJobChange} placeholder="Positions"/>
            <input name="skills" value={jobForm.skills} onChange={handleJobChange} placeholder="Skills"/>

            <select name="status" value={jobForm.status} onChange={handleJobChange}>
              <option value="">Select Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="On Hold">On Hold</option>
            </select>

            <div className="job-modal-btns">
              <button onClick={() => setJobShowModal(false)}>Cancel</button>
              <button className="job-save-btn" onClick={handleAddJob}>Add</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default JobOpenings;
