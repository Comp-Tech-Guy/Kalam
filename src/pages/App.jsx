import "./App.css"
import { getData } from "../JS/fileSystem";
import { useEffect, useState } from "react";
import ProfileCard from "../components/profileCard";

function App() {
    const [data, setData] = useState(null);
    const dataRecieve = async () => {
        const json = await getData("userProfiles.json");
        setData(json);
    }
    let hasProfiles = data && data.profiles && data.profiles.length > 0;
    
    useEffect(() => {
        dataRecieve();
        hasProfiles = data && data.profiles && data.profiles.length > 0;
    }, [dataRecieve])


    return (
        <main className="AppPg">
            <h1>Home</h1>
            <button onClick={dataRecieve}>Refresh</button>
            <div className="profile-grid">
                {data ? (
                    hasProfiles ? (
                        data.profiles.map((profile) => (
                            <ProfileCard key={profile.id} data={profile} onRecieve={dataRecieve} />
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
        </main>
    );
}

export default App