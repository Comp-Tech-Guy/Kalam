import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { exportProfile, exportAllProfiles, importSingleProfile, importAllProfiles } from "../../services/storage";
import "./ImportExportModal.css";

function ImportExportModal({ mode, profiles, onClose }) {
  const isExport = mode === "export";
  const [selectedOption, setSelectedOption] = useState("single");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleExport = async () => {
    try {
      setStatus("loading");
      setStatusMessage("");

      let content;
      let defaultName;

      if (selectedOption === "single") {
        const profile = profiles.find(p => p.id === Number(selectedProfileId));
        if (!profile) {
          setStatus("error");
          setStatusMessage("Please select a profile to export.");
          return;
        }
        content = exportProfile(profile);
        defaultName = `${profile.Name.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
      } else {
        content = await exportAllProfiles();
        defaultName = "all_profiles.json";
      }

      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: defaultName,
      });

      if (!filePath) {
        setStatus("idle");
        return;
      }

      await writeTextFile(filePath, content);
      setStatus("success");
      setStatusMessage("Exported successfully!");
    } catch (e) {
      setStatus("error");
      setStatusMessage(`Export failed: ${e.message}`);
    }
  };

  const handleImport = async () => {
    try {
      setStatus("loading");
      setStatusMessage("");

      const filePath = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (!filePath) {
        setStatus("idle");
        return;
      }

      const content = await readTextFile(filePath);
      const data = JSON.parse(content);

      if (selectedOption === "single") {
        if (!data.Name && !data.name) {
          setStatus("error");
          setStatusMessage("Invalid profile file. Expected a profile object with a name.");
          return;
        }
        await importSingleProfile(data);
      } else {
        let profilesArray = data.profiles || data;
        if (!Array.isArray(profilesArray)) {
          setStatus("error");
          setStatusMessage("Invalid file. Expected an array of profiles or { profiles: [...] }.");
          return;
        }
        await importAllProfiles(profilesArray);
      }

      setStatus("success");
      setStatusMessage("Imported successfully!");
      setTimeout(() => onClose(true), 1500);
    } catch (e) {
      setStatus("error");
      setStatusMessage(`Import failed: ${e.message}`);
    }
  };

  const selectedProfile = profiles.find(p => p.id === Number(selectedProfileId));

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => onClose(false)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2>{isExport ? "Export Profiles" : "Import Profiles"}</h2>
        <p className="modal-subtitle">
          {isExport
            ? "Save your profile configuration to share or transfer to another device."
            : "Load a profile configuration from a file."}
        </p>

        <div className="modal-options">
          <label className={`modal-option ${selectedOption === "single" ? "active" : ""}`}>
            <input
              type="radio"
              name="scope"
              value="single"
              checked={selectedOption === "single"}
              onChange={() => setSelectedOption("single")}
            />
            <span className="modal-option-label">
              {isExport ? "Export single profile" : "Import single profile"}
            </span>
          </label>
          <label className={`modal-option ${selectedOption === "all" ? "active" : ""}`}>
            <input
              type="radio"
              name="scope"
              value="all"
              checked={selectedOption === "all"}
              onChange={() => setSelectedOption("all")}
            />
            <span className="modal-option-label">
              {isExport ? "Export all profiles" : "Import all profiles"}
            </span>
          </label>
        </div>

        {isExport && selectedOption === "single" && (
          <div className="modal-field">
            <label>Select Profile</label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
            >
              <option value="">-- Choose a profile --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.Name}</option>
              ))}
            </select>
            {selectedProfile && (
              <div className="modal-profile-preview">
                {Object.entries({
                  RainmeterLayoutName: "Rainmeter",
                  "Yasb-Yaml": "YASB",
                  "GlazeWM-Config": "GlazeWM",
                  "Zebar-Config": "Zebar",
                  "Windhawk-Mods": "Windhawk",
                  "Wallpaper-Path": "Wallpaper",
                }).filter(([key]) => {
                  const val = selectedProfile[key];
                  if (key === "Windhawk-Mods") return Array.isArray(val) && val.length > 0;
                  return val && val !== "";
                }).map(([key, label]) => (
                  <span key={key} className="preview-badge">{label}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="modal-status success">{statusMessage}</div>
        )}
        {status === "error" && (
          <div className="modal-status error">{statusMessage}</div>
        )}

        <div className="modal-actions">
          <button className="btn-detect" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button
            className="btn-submit"
            onClick={isExport ? handleExport : handleImport}
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? "Processing..." : isExport ? "Export" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportExportModal;
