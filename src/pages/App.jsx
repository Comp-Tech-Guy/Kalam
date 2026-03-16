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

    useEffect(() => {
        dataRecieve();
    }, [])

    return (
        <main className="AppPg">
            <h1>Home</h1>
            <button onClick={dataRecieve}>Refresh</button>
            <ProfileCard data={data} onRecieve={dataRecieve}/>
        </main>
    );
}

export default App