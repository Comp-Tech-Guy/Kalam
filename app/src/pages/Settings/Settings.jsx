import { useEffect, useState } from "react";
import "../../styles/forms.css"
import { editData, getData, setTheme as saveTheme, resolveTheme } from "../../services/storage";
import { autoDetectPaths as detectSidecarPaths } from "../../services/sidecar";

function Settings() {
    const [rainPath, setRainPath] = useState('');
    const [yasbExe, setYasbExe] = useState('');
    const [yasbPath, setYasbPath] = useState('');
    const [glazePath, setGlazePath] = useState('');
    const [zebarPath, setZebarPath] = useState('');
    const [windhawkType, setWindhawkType] = useState('Installed');
    const [windhawkPath, setWindhawkPath] = useState('');
    const [komorebiPath, setKomorebiPath] = useState('');
    const [bloomConfigPath, setBloomConfigPath] = useState('');
    const [bloomExePath, setBloomExePath] = useState('');
    const [detecting, setDetecting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState('system');

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
                setKomorebiPath(data["Komorebi-Config-Path"] || "");
                setBloomConfigPath(data["Bloom-Config-Path"] || "");
                setBloomExePath(data["Bloom-Exe-Path"] || "");
                setTheme(data["theme"] || "system");
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
            if (found['Yasb-Exe-Path']) setYasbExe(found['Yasb-Exe-Path']);
            if (found['Yasb-Config-Path']) setYasbPath(found['Yasb-Config-Path']);
            if (found['GlazeWM-Config-Path']) setGlazePath(found['GlazeWM-Config-Path']);
            if (found['Zebar-Config-Path']) setZebarPath(found['Zebar-Config-Path']);
            if (found['Windhawk-Path']) setWindhawkPath(found['Windhawk-Path']);
            if (found['Windhawk-Type']) setWindhawkType(found['Windhawk-Type']);
            if (found['Komorebi-Config-Path']) setKomorebiPath(found['Komorebi-Config-Path']);
            if (found['Bloom-Config-Path']) setBloomConfigPath(found['Bloom-Config-Path']);
            if (found['Bloom-Exe-Path']) setBloomExePath(found['Bloom-Exe-Path']);

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
            "Windhawk-Path": windhawkPath,
            "Komorebi-Config-Path": komorebiPath,
            "Bloom-Config-Path": bloomConfigPath,
            "Bloom-Exe-Path": bloomExePath
        }
        try {
            await editData("userSettings.json", data);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            setError("Failed to save settings");
        }
    }

    const handleThemeChange = async (newTheme) => {
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', resolveTheme(newTheme));
        await saveTheme(newTheme);
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
                    <label>Appearance</label>
                    <div className="theme-toggle">
                        <button
                            className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('dark')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            Dark
                        </button>
                        <button
                            className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('light')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                            Light
                        </button>
                        <button
                            className={`theme-toggle-btn ${theme === 'system' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('system')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            System
                        </button>
                    </div>
                </div>

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
                        placeholder="C:\Users\Name\.config\yasb"
                    />
                </div>

                <div className="form-group">
                    <label>GlazeWM Config Path</label>
                    <input
                        type="text"
                        value={glazePath}
                        onChange={(e) => setGlazePath(e.target.value)}
                        placeholder="C:\Users\Name\.glzr\glazewm"
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

                <div className="form-group">
                    <label>Komorebi Config Path</label>
                    <input
                        type="text"
                        value={komorebiPath}
                        onChange={(e) => setKomorebiPath(e.target.value)}
                        placeholder="C:\Users\Name"
                    />
                </div>

                <div className="form-group">
                    <label>Bloom Config Path</label>
                    <input
                        type="text"
                        value={bloomConfigPath}
                        onChange={(e) => setBloomConfigPath(e.target.value)}
                        placeholder="C:\Users\Name\AppData\Roaming\com.sehaz.bloom"
                    />
                </div>

                <div className="form-group">
                    <label>Bloom Exe Path</label>
                    <input
                        type="text"
                        value={bloomExePath}
                        onChange={(e) => setBloomExePath(e.target.value)}
                        placeholder="C:\Users\Name\AppData\Local\bloom\bloom.exe"
                    />
                </div>

                <div className="form-actions">
                    <button
                        className="btn-detect"
                        onClick={autoDetectPaths}
                        disabled={detecting}
                    >
                        {detecting ? "Scanning..." : "Auto Detect Paths"}
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
