import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import SideCar from "../JS/SideCar"; 
import "./App.css";

function ProfilePage(){
    const [arg2_image_path, setArg2ImagePath] = useState(null);
    const [arg3_rainmeter_path, setArg3RainmeterPath] = useState(null);
    const [arg4_layout, setArg4Layout] = useState(null);
    const [arg5_Name, setArg5Name] = useState(null);

    const out = async () => {
        if(setArg2ImagePath != null && setArg3RainmeterPath != null && setArg4Layout != null && setArg5Name != null)
            await SideCar(arg2_image_path, arg3_rainmeter_path, arg4_layout);
    }

    async function selectFile() {
        try {
            const select = await open({
                multiple: false,
                directory: false,
                title: "Select a file",
                filters: [{
                    name: "Images",
                    extensions: ["png", "jpg", "jpeg"]
                }]
            });

            if (select === null) {
                console.log("No file selected");
                return;
            }

            console.log("Selected file path:", select);
            setArg2ImagePath(select);
        } catch (e) {
            console.log("Error selecting file:", e);
            return;
        }
    }

    return (
        <div className="profilePg">
            <div>
                Name: 
                <input type="text" onChange={(e) => setArg5Name(e.target.value)}/>
            </div>
            <div>
                Wallpaper-IMG: 
                <button onClick={selectFile}>Select file</button>
            </div>
            <div>
                Rainmeter-Path: 
                <input type="text" onChange={(e) => setArg3RainmeterPath(e.target.value)}/>
            </div>
            <div>
                Rainmeter-Layout-Name:
                <input type="text" onChange={(e) => setArg4Layout(e.target.value)}/>
            </div>
            <div>
                <button onClick={out}>Enter</button>
            </div>
        </div>
    )   
}

export default ProfilePage