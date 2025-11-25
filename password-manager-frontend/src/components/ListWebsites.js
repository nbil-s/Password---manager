import React, { useState } from "react";
import axios from "axios";

function ListWebsites() {
  const [websites, setWebsites] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const listWebsites = async () => {
    try {
      const response = await axios.get("http://localhost:3000/list");
      setWebsites(response.data.websites);
      setHasLoaded(true);
    } catch (error) {
      alert(error.response?.data?.error || "Error listing websites.");
    }
  };

  return (
    <div className="feature-card">
      <h2>List All Websites</h2>
      <p className="support-copy">See every site currently stored in the keychain.</p>
      <button onClick={listWebsites}>List Websites</button>
      {hasLoaded && websites.length === 0 && <p className="support-copy">No entries yet.</p>}
      {websites.length > 0 && (
        <ul className="list-display">
          {websites.map((site, index) => (
            <li key={index}>{site}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListWebsites;
