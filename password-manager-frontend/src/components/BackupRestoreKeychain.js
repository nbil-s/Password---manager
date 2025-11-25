import React, { useState } from "react";
import axios from "axios";

const BackupRestoreKeychain = () => {
  const [file, setFile] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");

  const handleBackup = () => {
    window.location.href = "http://localhost:3000/backup";
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== "application/json") {
      alert("Please select a valid JSON file.");
      setFile(null);
    } else {
      setFile(selectedFile || null);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      alert("Please select a file to restore.");
      return;
    }

    if (!masterPassword.trim()) {
      alert("Please enter your master password.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("masterPassword", masterPassword);

    try {
      const response = await axios.post("http://localhost:3000/restore", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to restore keychain.");
    }
  };

  return (
    <div className="feature-card feature-card--tall">
      <h2>Backup & Restore</h2>
      <p className="support-copy">Download a JSON backup or restore from a previous copy.</p>
      <button onClick={handleBackup}>Download Backup</button>
      <div className="stacked-inputs feature-stack">
        <input type="file" onChange={handleFileChange} accept=".json" />
        {file && <p className="support-copy">Selected file: {file.name}</p>}
        <input
          type="password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          placeholder="Master Password"
        />
        <button onClick={handleRestore}>Upload & Restore</button>
      </div>
    </div>
  );
};

export default BackupRestoreKeychain;
