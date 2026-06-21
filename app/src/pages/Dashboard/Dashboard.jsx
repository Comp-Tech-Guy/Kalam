import "./Dashboard.css"
import { getData } from "../../services/storage";
import { useEffect, useState, useCallback } from "react";
import ProfileCard from "../../components/ProfileCard/ProfileCard";
import { stopAll } from "../../services/sidecar";

function Dashboard() {
    const [data, setData] = useState(null);
    const [stopping, setStopping] = useState(false);
    
    const dataRecieve = useCallback(async (forceRefresh) => {
        const json = await getData("userProfiles.json", forceRefresh);
        setData(json);
    }, []);

    useEffect(() => {
        dataRecieve();
    }, [dataRecieve]);

    const refresh = () => dataRecieve(true);

    const hasProfiles = data && data.profiles && data.profiles.length > 0;

    const handleStopAll = async () => {
        setStopping(true);
        try {
            await stopAll();
        } catch (e) {
            console.error("Stop all failed:", e);
        } finally {
            setStopping(false);
        }
    };

    return (
        <main className="AppPg">
            <header className="dashboard-header">
                <div className="dashboard-header-text">
                    <h1>My Profiles</h1>
                    <p>Select a configuration to apply to your desktop.</p>
                </div>
                <button className="btn-stop-all" onClick={handleStopAll} disabled={stopping}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    {stopping ? "Stopping..." : "Stop All"}
                </button>
            </header>
            
            <div className="profile-grid">
                {data ? (
                    hasProfiles ? (
                        data.profiles.map((profile) => (
                            <ProfileCard key={profile.id} data={profile} onRecieve={refresh} />
                        ))
                    ) : (
                        <div className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 16 }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                            <h3>No profiles yet</h3>
                            <p>Create your first profile to bundle your desktop configuration.</p>
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
