import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeData } from "../../services/storage";
import sidecar from "../../services/sidecar";
import "./ProfileCard.css";

const TOOL_ICONS = {
  RainmeterLayoutName: { label: "Rainmeter", icon: "🌧️" },
  "Yasb-Yaml": { label: "YASB", icon: "📊" },
  "GlazeWM-Config": { label: "GlazeWM", icon: "🪟" },
  "Zebar-Config": { label: "Zebar", icon: "📌" },
  "Windhawk-Mods": { label: "Windhawk", icon: "🔧" },
};

function ProfileCard({ data, onRecieve }) {
  const [started, setStarted] = useState("Run");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const activeTools = Object.entries(TOOL_ICONS).filter(([key]) => {
    const val = data[key];
    if (key === "Windhawk-Mods") return Array.isArray(val) && val.length > 0;
    return val && val !== "";
  });

  const onStart = async (id) => {
    setStarted("Running...");
    setError("");
    try {
      await sidecar(id);
      setStarted("Done!");
      setTimeout(() => setStarted("Run"), 2000);
    } catch (e) {
      setError(e.message || "Failed to apply profile");
      setStarted("Run");
    }
  };

  const onRemove = async (id) => {
    try {
      await removeData("userProfiles.json", id);
      await onRecieve();
    } catch (e) {
      alert(`Failed to remove profile: ${e.message}`);
    }
  };

  const onEdit = () => {
    navigate("/profile", { state: { profile: data } });
  };

  return (
    <div className="profile-row">
      <div className="profile-row-name">
        <h3>{data.Name}</h3>
      </div>

      <div className="profile-row-tools">
        {activeTools.map(([key, { label, icon }]) => (
          <span key={key} className="tool-badge" title={label}>
            <span className="tool-badge-icon">{icon}</span>
            {label}
          </span>
        ))}
      </div>

      {error && <span className="profile-row-error">{error}</span>}

      <div className="profile-row-actions">
        <button className="btn btn-start" onClick={() => onStart(data.id)}>
          {started === "Run" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
          {started}
        </button>
        <button className="btn btn-edit" onClick={onEdit}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button className="btn btn-remove" onClick={() => onRemove(data.id)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Remove
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;
