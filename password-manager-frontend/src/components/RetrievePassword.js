import React, { useState } from "react";
import axios from "axios";

function RetrievePassword() {
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");

  const retrievePassword = async () => {
    try {
      const response = await axios.get("http://localhost:3000/retrieve", {
        params: { website },
      });
      setPassword(response.data.password || "No password found.");
    } catch (error) {
      alert(error.response?.data?.message || "Error retrieving password.");
      setPassword("");
    }
  };

  return (
    <div className="feature-card">
      <h2>Retrieve a Password</h2>
      <p className="support-copy">Look up a stored password by entering the matching website.</p>
      <div className="stacked-inputs">
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
        />
        <button onClick={retrievePassword}>Retrieve Password</button>
      </div>
      {password && (
        <div className="inline-feedback">
          <p className="subtle-label">Password</p>
          <p className="password-display">{password}</p>
        </div>
      )}
    </div>
  );
}

export default RetrievePassword;
