import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeData } from "../../services/storage";
import sidecar from "../../services/sidecar";
import RainmeterIcon from "../icons/RainmeterIcon";
import YasbIcon from "../icons/YasbIcon";
import GlazeWmIcon from "../icons/GlazeWmIcon";
import ZebarIcon from "../icons/ZebarIcon";
import WindhawkIcon from "../icons/WindhawkIcon";
import KomorebiIcon from "../icons/KomorebiIcon";
import BloomIcon from "../icons/BloomIcon";
import "./ProfileCard.css";

const TOOL_ICONS = {
  RainmeterLayoutName: { label: "Rainmeter", icon: <RainmeterIcon size={14} /> },
  "Yasb-Yaml": { label: "YASB", icon: <YasbIcon size={14} /> },
  "GlazeWM-Config": { label: "GlazeWM", icon: <GlazeWmIcon size={14} /> },
  "Zebar-Config": { label: "Zebar", icon: <ZebarIcon size={14} /> },
  "Windhawk-Mods": { label: "Windhawk", icon: <WindhawkIcon size={14} /> },
  "Komorebi-Config": { label: "Komorebi", icon: <KomorebiIcon size={14} /> },
  "Bloom-Config": { label: "Bloom", icon: <BloomIcon size={14} /> },
};

function ProfileCard({ data, onReceive }) {
  const [started, setStarted] = useState("Run");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  const activeTools = Object.entries(TOOL_ICONS).filter(([key]) => {
    const val = data[key];
    if (key === "Windhawk-Mods") return Array.isArray(val) && val.length > 0;
    return val && val !== "";
  });

  const onStart = async (id) => {
    setStarted("Running...");
    setError("");
    setNotice("");
    try {
      const output = await sidecar(id);
      const warnings = output
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("WARNING:"));
      if (warnings.length > 0) setNotice(warnings.join(" "));
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
      await onReceive();
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
      {!error && notice && <span className="profile-row-notice">{notice}</span>}

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
