import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { addData, editData, getData } from "../../services/storage";
import sidecar from "../../services/sidecar";
import SelectMenu from "../../components/SelectMenu/SelectMenu";
import ResizableTextarea from "../../components/ResizableTextarea/ResizableTextarea";
import "../Dashboard/Dashboard.css";

function CreateProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileId, setProfileId] = useState(null);
  
  const [headName, setHeadName] = useState("Add New");
  const [name, setName] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [added, setAdded] = useState(false);

  // Enabled Tools Checklist
  const [enabledApps, setEnabledApps] = useState({
    rainmeter: false,
    yasb: false,
    glazewm: false,
    zebar: false,
    windhawk: false
  });

  // Individual App States
  const [rainLayout, setRainLayout] = useState("");
  const [yasbYaml, setYasbYaml] = useState("");
  const [yasbCSS, setYasbCSS] = useState("");
  const [glazeWm, setGlazeWm] = useState("");
  const [zebar, setZebar] = useState("");

  // Tool scan states
  const [installedMods, setInstalledMods] = useState([]);
  const [windhawkMods, setWindhawkMods] = useState([]);
  const [availableRainmeterLayouts, setAvailableRainmeterLayouts] = useState([]);
  const hasAutoPopulated = useRef(false);

  async function loadManifest(fileName) {
    try {
      return await getData(fileName, true);
    } catch {
      return null;
    }
  }

  // Scan all tools and pre-populate configs exactly once (never auto-check checkboxes)
  useEffect(() => {
    if (!isEditing && !hasAutoPopulated.current) {
      const scanAndPrepopulate = async () => {
        try {
          await sidecar("scan");

          const [rmManifest, yasbManifest, glazeManifest, zebarManifest, whManifest] = await Promise.all([
            loadManifest("rainmeterManifest.json"),
            loadManifest("yasbManifest.json"),
            loadManifest("glazewmManifest.json"),
            loadManifest("zebarManifest.json"),
            loadManifest("windhawkManifest.json"),
          ]);

          if (rmManifest) {
            setAvailableRainmeterLayouts(rmManifest.layouts || []);
            if (rmManifest.currentLayout) {
              setRainLayout(rmManifest.currentLayout);
            }
          }

          if (yasbManifest) {
            if (yasbManifest.yaml) setYasbYaml(yasbManifest.yaml);
            if (yasbManifest.css) setYasbCSS(yasbManifest.css);
          }

          if (glazeManifest && glazeManifest.config) {
            setGlazeWm(glazeManifest.config);
          }

          if (zebarManifest && zebarManifest.config) {
            setZebar(zebarManifest.config);
          }

          if (whManifest && whManifest.installedMods) {
            setInstalledMods(whManifest.installedMods);
            const allMods = whManifest.installedMods.map(mod => ({
              id: mod.id,
              enabled: mod.enabled ?? 1,
              settings: mod.settings || {}
            }));
            setWindhawkMods(allMods);
          }
        } catch (e) {
          console.error("Failed to scan tool configs:", e);
        }

        hasAutoPopulated.current = true;
      };
      scanAndPrepopulate();
    }
  }, [isEditing]);

  useEffect(() => {
    if (location.state && location.state.profile) {
      const p = location.state.profile;
      setIsEditing(true);
      setProfileId(p.id);
      setHeadName("Edit");
      setName(p.Name || "");
      setImagePath(p["Wallpaper-Path"] || "");
      setRainLayout(p.RainmeterLayoutName || "");
      setYasbYaml(p["Yasb-Yaml"] || "");
      setYasbCSS(p["Yasb-CSS"] || "");
      setGlazeWm(p["GlazeWM-Config"] || "");
      setZebar(p["Zebar-Config"] || "");
      
      const whMods = p["Windhawk-Mods"] || [];
      setWindhawkMods(whMods);

      // Auto-check tools that have values in edit mode
      setEnabledApps({
        rainmeter: !!p.RainmeterLayoutName,
        yasb: !!(p["Yasb-Yaml"] || p["Yasb-CSS"]),
        glazewm: !!p["GlazeWM-Config"],
        zebar: !!p["Zebar-Config"],
        windhawk: whMods.length > 0
      });
    } else {
      reset();
      setIsEditing(false);
      setProfileId(null);
      setHeadName("Add New");
    }
  }, [location.state]);

  const handleAppToggle = (app, checked) => {
    setEnabledApps(prev => ({ ...prev, [app]: checked }));
  };

  const handleModToggle = (modId, checked) => {
    setWindhawkMods(prev => {
      const existing = prev.find(m => m.id === modId);
      if (existing) {
        return prev.map(m => m.id === modId ? { ...m, enabled: checked ? 1 : 0 } : m);
      } else {
        return [...prev, { id: modId, enabled: checked ? 1 : 0, settings: {} }];
      }
    });
  };

  const handleModSettingsChange = (modId, settingsStr) => {
    setWindhawkMods(prev => {
      let parsed = {};
      try {
        parsed = JSON.parse(settingsStr);
      } catch (e) {
        // Fallback to raw string if invalid JSON (will validate on save)
        parsed = settingsStr;
      }
      const existing = prev.find(m => m.id === modId);
      if (existing) {
        return prev.map(m => m.id === modId ? { ...m, settings: parsed } : m);
      } else {
        return [...prev, { id: modId, enabled: 1, settings: parsed }];
      }
    });
  };

  const getModSettingsString = (modId) => {
    const mod = windhawkMods.find(m => m.id === modId);
    if (!mod || !mod.settings) return "{\n  \n}";
    if (typeof mod.settings === "string") return mod.settings;
    return JSON.stringify(mod.settings, null, 2);
  };

  const isModEnabled = (modId) => {
    const mod = windhawkMods.find(m => m.id === modId);
    return mod ? mod.enabled === 1 : false;
  };

  const storeData = async () => {
    let id = profileId;
    if (!isEditing) {
      id = Date.now();
    }
    
    // Validate and serialize Windhawk mods
    let formattedWindhawkMods = [];
    if (enabledApps.windhawk) {
      try {
        formattedWindhawkMods = windhawkMods
          .filter(m => m.enabled === 1) // Only store enabled mods in the profile
          .map(m => {
            let settings = m.settings;
            if (typeof settings === "string") {
              try {
                settings = JSON.parse(settings);
              } catch (e) {
                alert(`Invalid JSON settings for mod: ${m.id}`);
                throw new Error(`Invalid JSON in mod settings for ${m.id}`);
              }
            }
            return {
              id: m.id,
              enabled: 1,
              settings
            };
          });
      } catch (err) {
        return; // Stop execution on invalid JSON
      }
    }

    const data = {
      id: id,
      Name: name,
      RainmeterLayoutName: enabledApps.rainmeter ? rainLayout : "",
      "Wallpaper-Path": imagePath,
      "Yasb-Yaml": enabledApps.yasb ? yasbYaml : "",
      "Yasb-CSS": enabledApps.yasb ? yasbCSS : "",
      "GlazeWM-Config": enabledApps.glazewm ? glazeWm : "",
      "Zebar-Config": enabledApps.zebar ? zebar : "",
      "Windhawk-Mods": enabledApps.windhawk ? formattedWindhawkMods : []
    };

    try {
      if (isEditing) {
        await editData("userProfiles.json", data);
        setAdded(true);
        setTimeout(() => {
          setAdded(false);
          navigate("/");
        }, 1500);
      } else {
        await addData("userProfiles.json", data);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        reset();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reset = () => {
    setImagePath("");
    setYasbCSS("");
    setYasbYaml("");
    setRainLayout("");
    setGlazeWm("");
    setZebar("");
    setName("");
    setWindhawkMods([]);
    setAvailableRainmeterLayouts([]);
    setEnabledApps({
      rainmeter: false,
      yasb: false,
      glazewm: false,
      zebar: false,
      windhawk: false
    });
    hasAutoPopulated.current = false;
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
        <h1>{headName} Profile</h1>
        <p>Configure a setup layout for your desktop.</p>
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
          <div className="input-row">
            <input
              type="text"
              value={imagePath}
              readOnly
              placeholder="No file selected"
            />
            <button
              className="btn-refresh"
              onClick={selectFile}
            >
              {imagePath ? "Change File" : "Select File"}
            </button>
          </div>
        </div>

        {/* Enabled Tools Checklist */}
        <div className="form-group">
          <label>Enable Customization Tools</label>
          <div className="checkbox-grid">
            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={enabledApps.rainmeter}
                onChange={(e) => handleAppToggle("rainmeter", e.target.checked)}
              />
              <span className="checkbox-label">Rainmeter</span>
            </label>
            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={enabledApps.yasb}
                onChange={(e) => handleAppToggle("yasb", e.target.checked)}
              />
              <span className="checkbox-label">YASB</span>
            </label>
            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={enabledApps.glazewm}
                onChange={(e) => handleAppToggle("glazewm", e.target.checked)}
              />
              <span className="checkbox-label">GlazeWM</span>
            </label>
            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={enabledApps.zebar}
                onChange={(e) => handleAppToggle("zebar", e.target.checked)}
              />
              <span className="checkbox-label">Zebar</span>
            </label>
            <label className="checkbox-card">
              <input
                type="checkbox"
                checked={enabledApps.windhawk}
                onChange={(e) => handleAppToggle("windhawk", e.target.checked)}
              />
              <span className="checkbox-label">Windhawk</span>
            </label>
          </div>
        </div>

        {/* Conditional App Config Inputs */}
        {enabledApps.rainmeter && (
          <div className="form-group">
            <label>Rainmeter Layout</label>
            {availableRainmeterLayouts.length > 0 ? (
              <SelectMenu
                value={rainLayout}
                onChange={(e) => setRainLayout(e.target.value)}
                options={availableRainmeterLayouts}
                placeholder="Select a layout..."
              />
            ) : (
              <input
                type="text"
                value={rainLayout}
                onChange={(e) => setRainLayout(e.target.value)}
                placeholder="No layouts detected — type manually"
              />
            )}
          </div>
        )}

        {enabledApps.yasb && (
          <>
            <div className="form-group">
              <label>YASB Yaml</label>
              <ResizableTextarea
                value={yasbYaml}
                rows={5}
                onChange={(e) => setYasbYaml(e.target.value)}
                placeholder="YASB YAML code..."
              />
            </div>
            <div className="form-group">
              <label>YASB CSS</label>
              <ResizableTextarea
                value={yasbCSS}
                rows={5}
                onChange={(e) => setYasbCSS(e.target.value)}
                placeholder="YASB CSS code..."
              />
            </div>
          </>
        )}

        {enabledApps.glazewm && (
          <div className="form-group">
            <label>GlazeWM Config</label>
            <ResizableTextarea
              value={glazeWm}
              rows={5}
              onChange={(e) => setGlazeWm(e.target.value)}
              placeholder="GlazeWM configuration..."
            />
          </div>
        )}

        {enabledApps.zebar && (
          <div className="form-group">
            <label>Zebar Config</label>
            <ResizableTextarea
              value={zebar}
              rows={5}
              onChange={(e) => setZebar(e.target.value)}
              placeholder="Zebar configuration..."
            />
          </div>
        )}

        {enabledApps.windhawk && (
          <div className="form-group">
            <label>Windhawk Mods</label>
            <div className="windhawk-mods-container">
              {installedMods.length > 0 ? (
                installedMods.map((mod) => {
                  const isChecked = isModEnabled(mod.id);
                  return (
                    <div key={mod.id} className="windhawk-mod-item">
                      <div className="windhawk-mod-header">
                        <span className="windhawk-mod-title">{mod.name}</span>
                        <label className="checkbox-card mod-toggle-badge">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleModToggle(mod.id, e.target.checked)}
                          />
                          <span>{isChecked ? "Active" : "Inactive"}</span>
                        </label>
                      </div>
                      {isChecked && (
                        <div className="windhawk-mod-settings">
                          <label>Mod Settings (JSON)</label>
                          <ResizableTextarea
                            value={getModSettingsString(mod.id)}
                            rows={4}
                            onChange={(e) => handleModSettingsChange(mod.id, e.target.value)}
                            placeholder='e.g. { "show-labels": true }'
                            className="textarea-mono"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-mods-placeholder">
                  No installed Windhawk mods found. Make sure Windhawk is running and path is correct.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn-submit" onClick={storeData} disabled={added}>
            {added ? (isEditing ? "Profile Saved!" : "Profile Added!") : (isEditing ? "Save Changes" : "Add Profile")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateProfile;
