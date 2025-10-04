import React from "react";
import CertificateForm from "./CertificateForm";
import "./MobileStyles.css";

export default function App() {
  return (
    <div className="form-container">
      <h1 tabIndex={0}>Free Certificate Generator</h1>
      <CertificateForm />
      <footer>
        <small>
          Open Source. See <a href="https://github.com/Facelessism/certificate-generator" target="_blank" rel="noopener noreferrer">GitHub</a>
        </small>
      </footer>
    </div>
  );
}