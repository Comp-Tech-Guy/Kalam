import { useEffect, useState } from "react";
import "../Dashboard/Dashboard.css"
import { editData, getData } from "../../services/storage";

function Settings() {
    const [rainPath, setRainPath] = useState('');
    const [yasbExe, setYasbExe] = useState('');
    const [yasbPath, setYasbPath] = useState('');
    const [saved, setSaved] = useState(false);

    const loadData = async () => {
        const data = await getData("userSettings.json");
        if (data) {
            setRainPath(data["rainmeter-Path"] || "");
            setYasbExe(data["Yasb-Exe-Path"] || "");
            setYasbPath(data["Yasb-Config-Path"] || "");
        }
    }

    useEffect(() => {
        loadData();
    }, [])

    const storeData = async () => {
        const data = {
            "rainmeter-Path": rainPath,
            "Yasb-Config-Path": yasbPath,
            "Yasb-Exe-Path": yasbExe
        }
        await editData("userSettings.json", data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="AppPg">
            <header>
                <h1>Settings</h1>
                <p>Global paths and application configurations.</p>
            </header>
            
            <div className="settingCont">
                <div className="form-group">
                    <label>Rainmeter Path</label>
                    <input 
                        type="text" 
                        value={rainPath} 
                        onChange={(e) => setRainPath(e.target.value)} 
                        placeholder="C:\Program Files\Rainmeter\Rainmeter.exe"
                    />
                </div>

                <div className="form-group">
                    <label>YASB Exe Path</label>
                    <input 
                        type="text" 
                        value={yasbExe} 
                        onChange={(e) => setYasbExe(e.target.value)} 
                        placeholder="C:\Path\To\yasb.exe"
                    />
                </div>

                <div className="form-group">
                    <label>YASB Config Path</label>
                    <input 
                        type="text" 
                        value={yasbPath} 
                        onChange={(e) => setYasbPath(e.target.value)} 
                        placeholder="C:\Users\Name\.yasb"
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-submit" onClick={storeData} disabled={saved}>
                        {saved ? "Settings Saved!" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
