import React from "react";

function Stepper({ step, setStep, viewMode = false }) {
  return (
    <div className="stepper">
      <div
        className={`step ${step === 1 ? "active" : ""}`}
        onClick={() => setStep(1)}
        style={{ cursor: "pointer" }}
      >
        Personal Info
      </div>

      <div
        className={`step ${step === 2 ? "active" : ""}`}
        onClick={() => setStep(2)}
        style={{ cursor: "pointer" }}
      >
        Bank Info
      </div>

      <div
        className={`step ${step === 3 ? "active" : ""}`}
        onClick={() => setStep(3)}
        style={{ cursor: "pointer" }}
      >
        Education
      </div>

      <div
        className={`step ${step === 4 ? "active" : ""}`}
        onClick={() => setStep(4)}
        style={{ cursor: "pointer" }}
      >
        Experience
      </div>
    </div>
  );
}

export default Stepper;