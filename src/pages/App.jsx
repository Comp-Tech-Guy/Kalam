import "./App.css"
import { getData } from "../JS/fileSystem";
import { useEffect, useState } from "react";

function App() {
    const [data, setData] = useState(null);
    const dataRecieve = async () => {
        const json = await getData("userProfiles.json");
        setData(json);
    }

    useEffect(() => {
        dataRecieve();
    }, [])

    return (
        <main className="AppPg">
            <h1>Welcome to Home</h1>
            <button onClick={dataRecieve}>Refresh</button>
            <ul>
                {data ? (
                    data.profiles.map((profile) => (
                        <li key={profile.id}>{profile.Name}</li>
                    ))
                ) : (
                    <li>Loading profiles.....</li>
                )}
            </ul>
        </main>
    );
}

export default App