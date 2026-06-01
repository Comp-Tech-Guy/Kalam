import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeData } from "../../services/storage";
import sidecar from "../../services/sidecar";
import "./ProfileCard.css";

function ProfileCard({ data, onRecieve }) {
  const [started, setStarted] = useState("Run");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    await removeData("userProfiles.json", id);
    await onRecieve();
  };

  const onEdit = () => {
    navigate("/profile", { state: { profile: data } });
  };

  return (
    <div className="profile-card">
      <div className="card-content">
        <h3 className="profile-name">{data.Name}</h3>
        {error && <p className="profile-error">{error}</p>}
      </div>
      <div className="card-actions">
        <button className="btn btn-start" onClick={() => onStart(data.id)}>
          {started}
        </button>
        <button className="btn btn-edit" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-remove" onClick={() => onRemove(data.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;
