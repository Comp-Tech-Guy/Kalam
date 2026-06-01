import "./Dashboard.css"
import { getData } from "../../services/storage";
import { useEffect, useState, useCallback } from "react";
import ProfileCard from "../../components/ProfileCard/ProfileCard";

function Dashboard() {
    const [data, setData] = useState(null);
    
    const dataRecieve = useCallback(async (forceRefresh) => {
        const json = await getData("userProfiles.json", forceRefresh);
        setData(json);
    }, []);

    useEffect(() => {
        dataRecieve();
    }, [dataRecieve]);

    const refresh = () => dataRecieve(true);

    const hasProfiles = data && data.profiles && data.profiles.length > 0;

    return (
        <main className="AppPg">
            <header>
                <h1>My Profiles</h1>
                <p>Select a configuration to apply to your desktop.</p>
                <button className="btn-refresh" onClick={refresh}>
                    Refresh List
                </button>
            </header>
            
            <div className="profile-grid">
                {data ? (
                    hasProfiles ? (
                        data.profiles.map((profile) => (
                            <ProfileCard key={profile.id} data={profile} onRecieve={refresh} />
                        ))
                    ) : (
                        <div className="no-profiles">
                            <p>No profiles found. Create your first one in the "New Profile" tab.</p>
                        </div>
                    )
                ) : (
                    <div className="loading-container">
                        <span className="loader"></span>
                        <p>Loading your setups...</p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Dashboard;
