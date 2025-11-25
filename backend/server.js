const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer"); // For file uploads
const fs = require("fs");
const path = require("path");
const { Keychain } = require("./password-manager.js");

const app = express();
const PORT = 3000;

const keychainFile = path.resolve(__dirname, "keychain.json");
let keychain = null;

// Enable CORS
app.use(cors());
app.use(bodyParser.json());

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" }); // Temporary folder for uploaded files

/**
 * Helper function to check if the keychain is loaded.
 */
function ensureKeychainLoaded(res) {
  if (!keychain) {
    res.status(400).json({ message: "Keychain not loaded. Please initialize first." });
    return false;
  }
  return true;
}

// Route to initialize or load keychain
app.post("/load", async (req, res) => {
  const { masterPassword } = req.body;

  try {
    if (fs.existsSync(keychainFile)) {
      keychain = await Keychain.loadFromFile(masterPassword, keychainFile);
      res.json({ message: "Keychain loaded successfully." });
    } else {
      keychain = await Keychain.init(masterPassword);
      await keychain.dumpToFile(keychainFile);
      res.json({ message: "New keychain created successfully." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to add a password
app.post("/add", async (req, res) => {
  const { website, password } = req.body;

  if (!ensureKeychainLoaded(res)) return;

  try {
    await keychain.set(website, password);
    await keychain.dumpToFile(keychainFile);
    res.json({ message: `Password for "${website}" added successfully.` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to retrieve a password
app.get("/retrieve", async (req, res) => {
  const { website } = req.query;

  if (!ensureKeychainLoaded(res)) return;

  try {
    const password = await keychain.get(website);
    if (password) {
      res.json({ password });
    } else {
      res.status(404).json({ message: "Password not found." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to remove a password
app.delete("/remove", async (req, res) => {
  const { website } = req.query;

  if (!ensureKeychainLoaded(res)) return;

  try {
    const removed = await keychain.remove(website);
    await keychain.dumpToFile(keychainFile);
    res.json({
      message: removed
        ? `Password for "${website}" removed successfully.`
        : `No password found for "${website}".`,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to list all websites
app.get("/list", (req, res) => {
  if (!ensureKeychainLoaded(res)) return;

  const websites = Object.keys(keychain.kvs || {});
  res.json({ websites });
});

// Backup keychain: Download keychain.json
app.get("/backup", (req, res) => {
  if (fs.existsSync(keychainFile)) {
    res.download(keychainFile, "keychain-backup.json", (err) => {
      if (err) {
        res.status(500).json({ message: "Failed to backup keychain." });
      }
    });
  } else {
    res.status(404).json({ message: "No keychain file found to backup." });
  }
});

// Restore keychain: Upload and replace keychain.json
app.post("/restore", upload.single("file"), async (req, res) => {
  const uploadedFilePath = req.file.path;

  try {
    // Validate uploaded file content
    const uploadedData = fs.readFileSync(uploadedFilePath, "utf8");

    if (!uploadedData || !JSON.parse(uploadedData).kvs) {
      throw new Error("Invalid keychain file format.");
    }

    fs.writeFileSync(keychainFile, uploadedData, "utf8");
    keychain = await Keychain.loadFromFile(req.body.masterPassword, keychainFile);
    res.json({ message: "Keychain restored successfully." });
  } catch (error) {
    console.error("Error restoring keychain:", error.message); // Log detailed error
    res.status(400).json({ message: "Failed to restore keychain. Ensure the file is valid." });
  } finally {
    // Clean up temporary uploaded file
    fs.unlinkSync(uploadedFilePath);
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
