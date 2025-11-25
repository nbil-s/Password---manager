import React, { useState } from "react";
import axios from "axios";

function RemovePassword() {
  const [website, setWebsite] = useState("");

  const removePassword = async () => {
    try {
      const response = await axios.delete("http://localhost:3000/remove", {
        params: { website },
      });
      alert(response.data.message);
      setWebsite("");
    } catch (error) {
      alert(error.response?.data?.message || "Error removing password.");
    }
  };

  return (
    <div className="feature-card">
      <h2>Remove a Password</h2>
      <p className="support-copy">Clean up old or unused credentials from your vault.</p>
      <div className="stacked-inputs">
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
        />
        <button onClick={removePassword}>Remove Password</button>
      </div>
    </div>
  );
}

export default RemovePassword;
