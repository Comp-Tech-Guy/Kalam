import "./Dashboard.css"
import "../../styles/forms.css"
import { getData } from "../../services/storage";
import { useEffect, useState, useCallback } from "react";
import ProfileCard from "../../components/ProfileCard/ProfileCard";
import ImportExportModal from "../../components/ImportExportModal/ImportExportModal";
import { stopAll } from "../../services/sidecar";

function Dashboard() {
    const [data, setData] = useState(null);
    const [stopping, setStopping] = useState(false);
    const [modalMode, setModalMode] = useState(null);
    
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
            alert(`Stop all failed: ${e.message}`);
        } finally {
            setStopping(false);
        }
    };

    const handleModalClose = (refreshed) => {
        setModalMode(null);
        if (refreshed) refresh();
    };

    return (
        <main className="AppPg">
            <header className="dashboard-header">
                <div className="dashboard-header-text">
                    <h1>My Profiles</h1>
                    <p>Select a configuration to apply to your desktop.</p>
                </div>
                <div className="dashboard-header-actions">
                    <button className="btn-header-export" onClick={() => setModalMode("export")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export
                    </button>
                    <button className="btn-header-import" onClick={() => setModalMode("import")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Import
                    </button>
                    <button className="btn-stop-all" onClick={handleStopAll} disabled={stopping}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        {stopping ? "Stopping..." : "Stop All"}
                    </button>
                </div>
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

            {modalMode && (
                <ImportExportModal
                    mode={modalMode}
                    profiles={data?.profiles || []}
                    onClose={handleModalClose}
                />
            )}
        </main>
    );
}

export default Dashboard;
