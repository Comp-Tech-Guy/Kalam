import { useEffect, useState } from "react";
import "../Dashboard/Dashboard.css"
import { editData, getData, setOnboardingComplete } from "../../services/storage";
import { autoDetectPaths as detectSidecarPaths } from "../../services/sidecar";

function Settings() {
    const [rainPath, setRainPath] = useState('');
    const [yasbExe, setYasbExe] = useState('');
    const [yasbPath, setYasbPath] = useState('');
    const [glazePath, setGlazePath] = useState('');
    const [zebarPath, setZebarPath] = useState('');
    const [windhawkType, setWindhawkType] = useState('Installed');
    const [windhawkPath, setWindhawkPath] = useState('');
    const [detecting, setDetecting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [onboardingReset, setOnboardingReset] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getData("userSettings.json");
            if (data) {
                setRainPath(data["rainmeter-Path"] || "");
                setYasbExe(data["Yasb-Exe-Path"] || "");
                setYasbPath(data["Yasb-Config-Path"] || "");
                setGlazePath(data["GlazeWM-Config-Path"] || "");
                setZebarPath(data["Zebar-Config-Path"] || "");
                setWindhawkType(data["Windhawk-Type"] || "Installed");
                setWindhawkPath(data["Windhawk-Path"] || "");
            }
        } catch (e) {
            setError("Failed to load settings");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [])

    const autoDetectPaths = async () => {
        setDetecting(true);
        setError('');
        try {
            const found = await detectSidecarPaths();

            if (found['rainmeter-Path']) setRainPath(found['rainmeter-Path']);
            if (found['Yasb-Config-Path']) setYasbPath(found['Yasb-Config-Path']);
            if (found['GlazeWM-Config-Path']) setGlazePath(found['GlazeWM-Config-Path']);
            if (found['Zebar-Config-Path']) setZebarPath(found['Zebar-Config-Path']);
            if (found['Windhawk-Path']) setWindhawkPath(found['Windhawk-Path']);
            if (found['Windhawk-Type']) setWindhawkType(found['Windhawk-Type']);

            if (Object.keys(found).length === 0) {
                setError("No tool installations detected. Please set paths manually.");
            }
        } catch (e) {
            setError("Failed to auto-detect paths: " + (e.message || e));
        } finally {
            setDetecting(false);
        }
    };

    const storeData = async () => {
        setError('');
        const data = {
            "rainmeter-Path": rainPath,
            "Yasb-Config-Path": yasbPath,
            "Yasb-Exe-Path": yasbExe,
            "GlazeWM-Config-Path": glazePath,
            "Zebar-Config-Path": zebarPath,
            "Windhawk-Type": windhawkType,
            "Windhawk-Path": windhawkPath
        }
        try {
            await editData("userSettings.json", data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            setError("Failed to save settings");
        }
    }

    const resetOnboarding = async () => {
        await setOnboardingComplete(false);
        setOnboardingReset(true);
        setTimeout(() => setOnboardingReset(false), 3000);
    };

    if (loading) {
        return (
            <div className="AppPg">
                <header>
                    <h1>Settings</h1>
                    <p>Loading your configuration...</p>
                </header>
                <div className="loading-container">
                    <span className="loader"></span>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="AppPg">
            <header>
                <h1>Settings</h1>
                <p>Global paths and application configurations.</p>
            </header>
            
            <div className="settingCont">
                {error && <div className="error-banner">{error}</div>}

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

                <div className="form-group">
                    <label>GlazeWM Config Path</label>
                    <input 
                        type="text" 
                        value={glazePath} 
                        onChange={(e) => setGlazePath(e.target.value)} 
                        placeholder="C:\Users\Name\.glazewm"
                    />
                </div>

                <div className="form-group">
                    <label>Zebar Config Path</label>
                    <input 
                        type="text" 
                        value={zebarPath} 
                        onChange={(e) => setZebarPath(e.target.value)} 
                        placeholder="C:\Users\Name\AppData\Roaming\zebar"
                    />
                </div>

                <div className="form-group">
                    <label>Windhawk Type</label>
                    <select 
                        value={windhawkType} 
                        onChange={(e) => setWindhawkType(e.target.value)}
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-light)",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            color: "var(--text-main)",
                            fontFamily: "inherit",
                            fontSize: "0.95rem",
                            outline: "none",
                            width: "100%",
                            boxSizing: "border-box"
                        }}
                    >
                        <option value="Installed">Installed (Service)</option>
                        <option value="Portable">Portable (File-based)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Windhawk Path</label>
                    <input 
                        type="text" 
                        value={windhawkPath} 
                        onChange={(e) => setWindhawkPath(e.target.value)} 
                        placeholder="C:\Path\To\windhawk.exe"
                    />
                </div>

                <div className="form-actions">
                    <button
                        className="btn-detect"
                        onClick={autoDetectPaths}
                        disabled={detecting}
                        style={{ marginRight: "auto" }}
                    >
                        {detecting ? "Scanning..." : "Auto Detect Paths"}
                    </button>
                    <button
                        id="settings-reset-onboarding"
                        className="btn-detect"
                        onClick={resetOnboarding}
                        disabled={onboardingReset}
                        style={{ opacity: 0.75 }}
                        title="Reset the onboarding wizard — it will show again on next app launch"
                    >
                        {onboardingReset ? "Onboarding Reset ✓" : "Show Onboarding Again"}
                    </button>
                    <button className="btn-submit" onClick={storeData} disabled={saved}>
                        {saved ? "Settings Saved!" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
