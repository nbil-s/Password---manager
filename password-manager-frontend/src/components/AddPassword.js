import React, { useState } from "react";
import axios from "axios";

function AddPassword() {
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");

  const addPassword = async () => {
    try {
      const response = await axios.post("http://localhost:3000/add", { website, password });
      alert(response.data.message);
      setWebsite("");
      setPassword("");
    } catch (error) {
      alert(error.response?.data?.message || "Error adding password.");
    }
  };

  return (
    <div className="feature-card">
      <h2>Add a Password</h2>
      <p className="support-copy">Store a new website credential inside your encrypted vault.</p>
      <div className="stacked-inputs">
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button onClick={addPassword}>Add Password</button>
      </div>
    </div>
  );
}

export default AddPassword;
