import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getLength, addData } from "../../services/storage";
import "../Dashboard/Dashboard.css";

function CreateProfile() {
    const [imagePath, setImagePath] = useState("");
    const [rainLayout, setRainLayout] = useState("");
    const [yasbYaml, setYasbYaml] = useState("");
    const [yasbCSS, setYasbCSS] = useState("");
    const [glazeWm, setGlazeWm] = useState("");
    const [zebar, setZebar] = useState("");
    const [name, setName] = useState("");
    const [added, setAdded] = useState(false);

    const storeData = async () => {
        const id = await getLength("userProfiles.json");
        const data = {
            id: id,
            Name: name,
            RainmeterLayoutName: rainLayout,
            "Wallaper-Path": imagePath,
            "Yasb-Yaml": yasbYaml,
            "Yasb-CSS": yasbCSS,
            "GlazeWM-Config": glazeWm,
            "Zebar-Config": zebar
        };
        setAdded(true);
        await addData("userProfiles.json", data);
        setTimeout(() => setAdded(false), 2000);
        reset();
    };

    const reset = () => {
        setImagePath("");
        setYasbCSS("");
        setYasbYaml("");
        setRainLayout("");
        setGlazeWm("");
        setZebar("");
        setName("");
    };

    async function selectFile() {
        try {
            const select = await open({
                multiple: false,
                directory: false,
                title: "Select a file",
                filters: [
                    {
                        name: "Images",
                        extensions: ["png", "jpg", "jpeg"],
                    },
                ],
            });

            if (select === null) return;
            setImagePath(select);
        } catch (e) {
            console.log("Error selecting file:", e);
        }
    }

    return (
        <div className="AppPg">
            <header>
                <h1>Add New Profile</h1>
                <p>Configure a new setup layout for your desktop.</p>
            </header>
            
            <div className="profileCont">
                <div className="form-group">
                    <label>Profile Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Minimal Dark"
                    />
                </div>
                
                <div className="form-group">
                    <label>Wallpaper Image</label>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <input type="text" value={imagePath} readOnly placeholder="No file selected" />
                        <button className="btn-refresh" style={{ margin: 0, whiteSpace: 'nowrap' }} onClick={selectFile}>
                            {imagePath ? "Change File" : "Select File"}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Rainmeter Layout</label>
                    <input
                        type="text"
                        value={rainLayout}
                        onChange={(e) => setRainLayout(e.target.value)}
                        placeholder="Layout name in Rainmeter"
                    />
                </div>

                <div className="form-group">
                    <label>YASB Yaml</label>
                    <textarea
                        value={yasbYaml}
                        rows={5}
                        onChange={(e) => setYasbYaml(e.target.value)}
                        placeholder="YASB YAML code..."
                    />
                </div>

                <div className="form-group">
                    <label>YASB CSS</label>
                    <textarea
                        value={yasbCSS}
                        rows={5}
                        onChange={(e) => setYasbCSS(e.target.value)}
                        placeholder="YASB CSS code..."
                    />
                </div>

                <div className="form-group">
                    <label>GlazeWM Config</label>
                    <textarea
                        value={glazeWm}
                        rows={5}
                        onChange={(e) => setGlazeWm(e.target.value)}
                        placeholder="GlazeWM configuration..."
                    />
                </div>

                <div className="form-group">
                    <label>Zebar Config</label>
                    <textarea
                        value={zebar}
                        rows={5}
                        onChange={(e) => setZebar(e.target.value)}
                        placeholder="Zebar configuration..."
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-submit" onClick={storeData} disabled={added}>
                        {added ? "Profile Added!" : "Add Profile"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateProfile;
