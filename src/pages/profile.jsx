import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getLength, addData } from "../JS/fileSystem";
import "./App.css";

function ProfilePage() {
    const [imagePath, setImagePath] = useState("");
    const [rainLayout, setRainLayout] = useState("");
    const [yasbYaml, setYasbYaml] = useState("");
    const [yasbCSS, setYasbCSS] = useState("");
    const [name, setName] = useState("");
    const [added, setAdded] = useState(Boolean);

    const storeData = async () => {
        const id = await getLength("userProfiles.json");
        const data = {
            "id": id,
            "Name": name,
            "RainmeterLayoutName": rainLayout,
            "Wallaper-Path": imagePath,
            "Yasb-Yaml": yasbYaml,
            "Yasb-CSS": yasbCSS
        }
        setAdded(true)
        await addData("userProfiles.json", data);
        setAdded(false)
        reset();
    }

    const reset = () => {
        setImagePath("");
        setYasbCSS("");
        setYasbYaml("");
        setRainLayout("");
        setName("");
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

            setImagePath(select);
        } catch (e) {
            console.log("Error selecting file:", e);
            return;
        }
    }

    return (
        <div className="profilePg">
            <h1>Add Profile</h1>
            <div className="profileCont">
                <div>
                    Name:
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    Wallpaper-IMG:
                    {imagePath ? (
                        <button onClick={selectFile}>Selected</button>
                    ) : (
                        <button onClick={selectFile}>Select file</button>
                    )}
                </div>
                <div>
                    Rainmeter-Layout-Name:
                    <input type="text" value={rainLayout} onChange={(e) => setRainLayout(e.target.value)} />
                </div>
                <div>
                    Yasb-Yaml-Code:
                    <textarea
                        value={yasbYaml}
                        rows={9}
                        onChange={(e) => setYasbYaml(e.target.value)}
                    />
                </div>
                <div>
                    Yasb-CSS-Code:
                    <textarea
                        value={yasbCSS}
                        rows={9}
                        onChange={(e) => setYasbCSS(e.target.value)}
                    />
                </div>
                <div>
                    {added ? (
                        <button>Added</button>
                    ) : (
                        <button onClick={storeData}>Add Profile</button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProfilePage