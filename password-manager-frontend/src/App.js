import React, { useState } from "react";
import axios from "axios";
import AddPassword from "./components/AddPassword";
import RetrievePassword from "./components/RetrievePassword";
import RemovePassword from "./components/RemovePassword";
import ListWebsites from "./components/ListWebsites";
import BackupRestoreKeychain from "./components/BackupRestoreKeychain";
import "./index.css";

function App() {
  const [masterPassword, setMasterPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load the keychain with the master password
  const loadKeychain = async () => {
    try {
      const response = await axios.post("http://localhost:3000/load", { masterPassword });
      alert(response.data.message);
      setIsAuthenticated(true);
    } catch (error) {
      alert(error.response?.data?.message || "Error loading keychain.");
    }
  };

  // If not authenticated, display the master password entry screen
  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className="hero-card">
          <p className="subtle-label">Secure Vault</p>
          <h1 className="app-title">Password Manager</h1>
          <p className="app-subtitle">Unlock your encrypted keychain to begin.</p>
          <div className="stacked-inputs">
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="Master Password"
            />
            <button onClick={loadKeychain}>Load Keychain</button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, display the main application screen
  return (
    <div className="app-shell">
      <div className="hero-card hero-card--compact">
        <p className="subtle-label">Vault Unlocked</p>
        <h1 className="app-title">Password Manager</h1>
        <p className="app-subtitle">
          Add, retrieve, and maintain your secrets with calm, distraction-free tools.
        </p>
      </div>
      <section className="features-section">
        <div className="features-heading">
          <p className="subtle-label">Vault Actions</p>
          <h2>Manage Everything In One Place</h2>
          <p>
            Perform every essential action add, inspect, remove, list, or back up entries without
            leaving this dashboard.
          </p>
        </div>
        <div className="features-grid">
          <AddPassword />
          <RetrievePassword />
          <RemovePassword />
          <ListWebsites />
          <BackupRestoreKeychain />
        </div>
      </section>
    </div>
  );
}

export default App;
