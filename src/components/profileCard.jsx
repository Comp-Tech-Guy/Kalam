import { useState } from "react";
import { removeData } from "../JS/fileSystem";
import SideCar from "../JS/SideCar";
import "./ProfileCard.css";

// Use PascalCase for components and destructure props
function ProfileCard({ keys, data, onRecieve }) {
    const [started, isStarted] = useState("Start");

    const onStart = async (id) => {
        isStarted("Starting...");
        await SideCar(id);
        isStarted("Start");
    }
    const onRemove = async (id) => {
        console.log("removing");
        await removeData("userProfiles.json", id);
        await onRecieve();
        console.log("removed");
    }

    return (
        <div key={data.id} className="profile-card">
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