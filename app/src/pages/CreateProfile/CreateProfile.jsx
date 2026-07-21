import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { addData, editData, getData } from "../../services/storage";
import sidecar from "../../services/sidecar";
import SelectMenu from "../../components/SelectMenu/SelectMenu";
import ResizableTextarea from "../../components/ResizableTextarea/ResizableTextarea";
import "../../styles/forms.css";
import "./CreateProfile.css";

function AccordionSection({ title, icon, expanded, onToggle, children }) {
  return (
    <div className={`accordion-section ${expanded ? "open" : ""}`}>
      <button className="accordion-header" onClick={onToggle}>
        <div className="accordion-header-left">
          <span className="accordion-icon">{icon}</span>
          <span className="accordion-title">{title}</span>
        </div>
        <svg className="accordion-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div className="accordion-body">
        <div className="accordion-content">
          <div className="accordion-inner">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileId, setProfileId] = useState(null);

  const [headName, setHeadName] = useState("Add New");
  const [name, setName] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [added, setAdded] = useState(false);

  // Enabled Tools
  const [enabledApps, setEnabledApps] = useState({
    rainmeter: false,
    yasb: false,
    glazewm: false,
    zebar: false,
    windhawk: false
  });

  // Tool configs
  const [rainLayout, setRainLayout] = useState("");
  const [yasbYaml, setYasbYaml] = useState("");
  const [yasbCSS, setYasbCSS] = useState("");
  const [glazeWm, setGlazeWm] = useState("");
  const [zebar, setZebar] = useState("");

  // Windhawk
  const [installedMods, setInstalledMods] = useState([]);
  const [windhawkMods, setWindhawkMods] = useState([]);
  const [availableRainmeterLayouts, setAvailableRainmeterLayouts] = useState([]);
  const hasAutoPopulated = useRef(false);

  // Accordion state — which sections are expanded
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function loadManifest(fileName) {
    try {
      return await getData(fileName, true);
    } catch {
      return null;
    }
  }

  // Scan all tools and pre-populate configs exactly once
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
            if (rmManifest.currentLayout) setRainLayout(rmManifest.currentLayout);
          }

          if (yasbManifest) {
            if (yasbManifest.yaml) setYasbYaml(yasbManifest.yaml);
            if (yasbManifest.css) setYasbCSS(yasbManifest.css);
          }

          if (glazeManifest && glazeManifest.config) setGlazeWm(glazeManifest.config);
          if (zebarManifest && zebarManifest.config) setZebar(zebarManifest.config);

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
          alert(`Scan failed: ${e.message}`);
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

      const enabled = {
        rainmeter: !!p.RainmeterLayoutName,
        yasb: !!(p["Yasb-Yaml"] || p["Yasb-CSS"]),
        glazewm: !!p["GlazeWM-Config"],
        zebar: !!p["Zebar-Config"],
        windhawk: whMods.length > 0
      };
      setEnabledApps(enabled);

      // Auto-expand enabled tool sections in edit mode
      const sections = {};
      if (enabled.rainmeter) sections.rainmeter = true;
      if (enabled.yasb) sections.yasb = true;
      if (enabled.glazewm) sections.glazewm = true;
      if (enabled.zebar) sections.zebar = true;
      if (enabled.windhawk) sections.windhawk = true;
      setExpandedSections(sections);
    } else {
      reset();
      setIsEditing(false);
      setProfileId(null);
      setHeadName("Add New");
    }
  }, [location.state]);

  const handleAppToggle = (app, checked) => {
    setEnabledApps(prev => ({ ...prev, [app]: checked }));
    if (checked) {
      setExpandedSections(prev => ({ ...prev, [app]: true }));
    }
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
      try { parsed = JSON.parse(settingsStr); } catch { parsed = settingsStr; }
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
    if (!isEditing) id = Date.now();

    let formattedWindhawkMods = [];
    if (enabledApps.windhawk) {
      try {
        formattedWindhawkMods = windhawkMods
          .filter(m => m.enabled === 1)
          .map(m => {
            let settings = m.settings;
            if (typeof settings === "string") {
              try { settings = JSON.parse(settings); } catch {
                alert(`Invalid JSON settings for mod: ${m.id}`);
                throw new Error(`Invalid JSON in mod settings for ${m.id}`);
              }
            }
            return { id: m.id, enabled: 1, settings };
          });
      } catch (err) {
        return;
      }
    }

    const data = {
      id,
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
        setTimeout(() => { setAdded(false); navigate("/"); }, 1500);
      } else {
        await addData("userProfiles.json", data);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        reset();
      }
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
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
    setEnabledApps({ rainmeter: false, yasb: false, glazewm: false, zebar: false, windhawk: false });
    setExpandedSections({});
    hasAutoPopulated.current = false;
  };

  async function selectFile() {
    try {
      const select = await open({
        multiple: false,
        directory: false,
        title: "Select a file",
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }],
      });
      if (select === null) return;
      setImagePath(select);
    } catch (e) {
      console.error("Error selecting file:", e);
    }
  }

  return (
    <div className="AppPg">
      <header>
        <h1>{headName} Profile</h1>
        <p>Configure a setup layout for your desktop.</p>
      </header>

      <div className="create-profile-layout">
        {/* ─── General Fields ──────────────────────────────── */}
        <div className="general-fields">
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
              <button className="btn-refresh" onClick={selectFile}>
                {imagePath ? "Change File" : "Select File"}
              </button>
            </div>
          </div>

          {/* Tool Checkboxes */}
          <div className="form-group">
            <label>Tools</label>
            <div className="checkbox-grid">
              {[
                { key: "rainmeter", label: "Rainmeter" },
                { key: "yasb", label: "YASB" },
                { key: "glazewm", label: "GlazeWM" },
                { key: "zebar", label: "Zebar" },
                { key: "windhawk", label: "Windhawk" },
              ].map(({ key, label }) => (
                <label className="checkbox-card" key={key}>
                  <input
                    type="checkbox"
                    checked={enabledApps[key]}
                    onChange={(e) => handleAppToggle(key, e.target.checked)}
                  />
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Tool Accordion Sections ─────────────────────── */}
        <div className="tool-accordions">
          {enabledApps.rainmeter && (
            <AccordionSection
              title="Rainmeter"
              icon="🌧️"
              expanded={!!expandedSections.rainmeter}
              onToggle={() => toggleSection("rainmeter")}
            >
              <div className="form-group">
                <label>Layout</label>
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
            </AccordionSection>
          )}

          {enabledApps.yasb && (
            <AccordionSection
              title="YASB"
              icon="📊"
              expanded={!!expandedSections.yasb}
              onToggle={() => toggleSection("yasb")}
            >
              <div className="form-group">
                <label>YAML Config</label>
                <ResizableTextarea
                  value={yasbYaml}
                  rows={5}
                  onChange={(e) => setYasbYaml(e.target.value)}
                  placeholder="YASB YAML code..."
                />
              </div>
              <div className="form-group">
                <label>CSS Styles</label>
                <ResizableTextarea
                  value={yasbCSS}
                  rows={5}
                  onChange={(e) => setYasbCSS(e.target.value)}
                  placeholder="YASB CSS code..."
                />
              </div>
            </AccordionSection>
          )}

          {enabledApps.glazewm && (
            <AccordionSection
              title="GlazeWM"
              icon="🪟"
              expanded={!!expandedSections.glazewm}
              onToggle={() => toggleSection("glazewm")}
            >
              <div className="form-group">
                <label>Config</label>
                <ResizableTextarea
                  value={glazeWm}
                  rows={5}
                  onChange={(e) => setGlazeWm(e.target.value)}
                  placeholder="GlazeWM configuration..."
                />
              </div>
            </AccordionSection>
          )}

          {enabledApps.zebar && (
            <AccordionSection
              title="Zebar"
              icon="📌"
              expanded={!!expandedSections.zebar}
              onToggle={() => toggleSection("zebar")}
            >
              <div className="form-group">
                <label>Config</label>
                <ResizableTextarea
                  value={zebar}
                  rows={5}
                  onChange={(e) => setZebar(e.target.value)}
                  placeholder="Zebar configuration..."
                />
              </div>
            </AccordionSection>
          )}

          {enabledApps.windhawk && (
            <AccordionSection
              title="Windhawk"
              icon="🔧"
              expanded={!!expandedSections.windhawk}
              onToggle={() => toggleSection("windhawk")}
            >
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
            </AccordionSection>
          )}
        </div>

        {/* ─── Actions ────────────────────────────────────── */}
        <div className="form-actions">
          {isEditing && (
            <button className="btn-detect" onClick={() => navigate("/")}>
              Cancel
            </button>
          )}
          <button className="btn-submit" onClick={storeData} disabled={added}>
            {added ? (isEditing ? "Profile Saved!" : "Profile Added!") : (isEditing ? "Save Changes" : "Add Profile")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateProfile;
