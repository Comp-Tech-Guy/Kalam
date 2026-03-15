import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import SideCar from "../JS/SideCar"; 
import { getLength, addData } from "../JS/fileSystem";
import "./App.css";

function ProfilePage(){
    const [imagePath, setImagePath] = useState("");
    const [rainLayout, setRainLayout] = useState("");
    const [name, setName] = useState("");

    const storeData = async () => {
        const id = await getLength("userProfiles.json");
        const data = {
            "id": id,
            "Name": name,
            "RainmeterLayoutName": rainLayout,
            "Wallaper-Path": imagePath
        }
        addData("userProfiles.json", data);
        reset();
    }

    const reset = () => {
        setImagePath("");
        setRainLayout("");
        setName("");
        console.log("Done");
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
            setImagePath(select);
        } catch (e) {
            console.log("Error selecting file:", e);
            return;
        }
    }

    return (
        <div className="profilePg">
            <div>
                Name: 
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
            </div>
            <div>
                Wallpaper-IMG: 
                {imagePath ? (
                    <button onClick={selectFile}>Selected</button>
                ): (
                    <button onClick={selectFile}>Select file</button>
                )}
            </div>
            <div>
                Rainmeter-Layout-Name:
                <input type="text" value={rainLayout} onChange={(e) => setRainLayout(e.target.value)}/>
            </div>
            <div>
                <button onClick={storeData}>Enter</button>
            </div>
        </div>
    )   
}

export default ProfilePage