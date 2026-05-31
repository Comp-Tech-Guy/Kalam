import { useState } from "react";
import { removeData } from "../../services/storage";
import sidecar from "../../services/sidecar";
import "./ProfileCard.css";

function ProfileCard({ data, onRecieve }) {
    const [started, isStarted] = useState("Start");

    const onStart = async (id) => {
        isStarted("Starting...");
        await sidecar(id);
        isStarted("Start");
    }
    const onRemove = async (id) => {
        await removeData("userProfiles.json", id);
        await onRecieve();
    }

    return (
        <div className="profile-card">
            <div className="card-content">
                <h3 className="profile-name">{data.Name}</h3>
            </div>
            <div className="card-actions">
                <button
                    className="btn btn-start"
                    onClick={() => onStart(data.id)}
                >
                    {started}
                </button>
                <button
                    className="btn btn-remove"
                    onClick={() => onRemove(data.id)}
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

export default ProfileCard;
