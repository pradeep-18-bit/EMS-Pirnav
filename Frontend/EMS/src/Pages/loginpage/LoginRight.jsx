import React from "react";
import fingerprint from "../../assets/FingerPrint.png";
 
export default function LoginRight() {
  return (
    <div
      className="right-panel"
      style={{
        flex: 1,
        background: "linear-gradient(180deg,#10b985,#10b985)",
        borderTopRightRadius: "22px",
        borderBottomRightRadius: "22px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          width: "100%",
          height: "137%",
          backgroundImage: `url(${fingerprint})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "contain"
        }}
      ></div>
    </div>
  );
}