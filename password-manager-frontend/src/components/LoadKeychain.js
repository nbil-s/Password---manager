import React, { useState } from "react";
import axios from "axios";

function LoadKeychain() {
  const [masterPassword, setMasterPassword] = useState("");

  const loadKeychain = async () => {
    try {
      const response = await axios.post("http://localhost:3000/load", { masterPassword });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || "Error loading keychain.");
    }
  };

  return (
    <div>
      <h2>Enter Master Password</h2>
      <input
        type="password"
        value={masterPassword}
        onChange={(e) => setMasterPassword(e.target.value)}
        placeholder="Master Password"
      />
      <button onClick={loadKeychain}>Load Keychain</button>
    </div>
  );
}

export default LoadKeychain;
