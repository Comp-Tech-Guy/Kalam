import { useEffect, useState } from "react";
import "./App.css"
import { editData, getData } from "../JS/fileSystem";

function Settings() {
    const [rainPath, setRainPath] = useState('');
    const [yasbExe, setYasbExe] = useState('');
    const [yasbPath, setYasbPath] = useState('');

    const setData = async () => {
        const data = await getData("userSettings.json");
        setRainPath(data["rainmeter-Path"])
        setYasbExe(data["Yasb-Exe-Path"])
        setYasbPath(data["Yasb-Config-Path"])
    }

    useEffect(() => {
        setData();
    }, [])

    const storeData = async () => {
        const data = {
            "rainmeter-Path": rainPath,
            "Yasb-Config-Path": yasbPath,
            "Yasb-Exe-Path": yasbExe
        }
        editData("userSettings.json", data);
    }

    return (
        <div className="settingPg">
            <h1>Settings</h1>
            <div className="settingCont">
                <div>
                    Yasb Config Path:
                    <input type="text" value={yasbPath} onChange={(e) => setYasbPath(e.target.value)} />
                </div>
                <div>
                    Yasb Exe Path:
                    <input type="text" value={yasbExe} onChange={(e) => setYasbExe(e.target.value)} />
                </div>
                <div>
                    Rainmeter Path:
                    <input type="text" value={rainPath} onChange={(e) => setRainPath(e.target.value)} />
                </div>
                <div>
                    <button onClick={storeData}>Update</button>
                </div>
            </div>
        </div>
    );
}

export default Settings