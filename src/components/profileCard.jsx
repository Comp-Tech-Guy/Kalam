import { removeData } from "../JS/fileSystem";
import SideCar from "../JS/SideCar";
import "./ProfileCard.css";

// Use PascalCase for components and destructure props
function ProfileCard({ data, onRecieve }) {
    // Check if data exists and has a profiles array
    const hasProfiles = data && data.profiles && data.profiles.length > 0;

    const onStart = (id) => {
        SideCar(id);
    }
    const onRemove = async (id) => {
        await removeData("userProfiles.json", id);
        await onRecieve();
    }

    return (
        <div className="profile-grid">
            {data ? (
                hasProfiles ? (
                    data.profiles.map((profile) => (
                        <div key={profile.id} className="profile-card">
                            <div className="card-content">
                                <h3 className="profile-name">{profile.Name}</h3>
                            </div>
                            <div className="card-actions">
                                <button
                                    className="btn btn-start"
                                    onClick={() => onStart(profile.id)}
                                >
                                    Start
                                </button>
                                <button
                                    className="btn btn-remove"
                                    onClick={() => onRemove(profile.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-profiles">No profiles found.</p>
                )
            ) : (
                <div className="loading-container">
                    <span className="loader"></span>
                    <p>Loading profiles...</p>
                </div>
            )}
        </div>
    );
}

export default ProfileCard;