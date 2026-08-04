import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-shell";
import { setOnboardingComplete } from "../../services/storage";
import kalamIcon from "../../assets/kalam-icon.png";
import GlazeWmIcon from "../../components/icons/GlazeWmIcon";
import ZebarIcon from "../../components/icons/ZebarIcon";
import YasbIcon from "../../components/icons/YasbIcon";
import RainmeterIcon from "../../components/icons/RainmeterIcon";
import WindhawkIcon from "../../components/icons/WindhawkIcon";
import WallpaperIcon from "../../components/icons/WallpaperIcon";
import KomorebiIcon from "../../components/icons/KomorebiIcon";
import BloomIcon from "../../components/icons/BloomIcon";
import "./Onboarding.css";

// ─── Data ────────────────────────────────────────────────────────────────────

const TOOLS = [
  { name: "GlazeWM", icon: <GlazeWmIcon size={36} /> },
  { name: "Zebar", icon: <ZebarIcon size={36} /> },
  { name: "YASB", icon: <YasbIcon size={36} /> },
  { name: "Rainmeter", icon: <RainmeterIcon size={36} /> },
  { name: "Windhawk", icon: <WindhawkIcon size={36} /> },
  { name: "Wallpaper", icon: <WallpaperIcon size={36} /> },
  { name: "Komorebi", icon: <KomorebiIcon size={36} /> },
  { name: "Bloom", icon: <BloomIcon size={36} /> },
];

const TOUR_ITEMS = [
  {
    icon: "🏠",
    label: "Home — Dashboard",
    desc: "View all your profiles. Apply a profile with one click.",
  },
  {
    icon: "✚",
    label: "New Profile",
    desc: "Create and edit profiles. Toggle which tools are included and configure their settings.",
  },
  {
    icon: "⚙",
    label: "Settings",
    desc: "Set global paths to your installed tools. Kalam can auto-detect common install locations.",
  },
];

const TOTAL_STEPS = 5;

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="step-indicator" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`step-dot ${i + 1 === current ? "active" : i + 1 < current ? "done" : ""}`}
        />
      ))}
    </div>
  );
}

// ─── Individual Steps ─────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="step-content" key="welcome">
      <div className="welcome-logo">
        <div className="welcome-logo-ring">
          <img src={kalamIcon} alt="Kalam" className="welcome-logo-img" />
        </div>
      </div>
      <h1 className="welcome-title">Welcome to Kalam</h1>
      <p className="welcome-subtitle">
        Profile-based desktop environment manager for Windows.
      </p>
      <p className="welcome-desc">
        Kalam lets you create profiles that bundle configurations for all your
        Windows customization tools. Switch your entire desktop setup —
        Rainmeter, taskbar, wallpaper, window manager, and more — with a single
        click.
      </p>
    </div>
  );
}

function StepTools() {
  return (
    <div className="step-content" key="tools">
      <h2 className="step-title">Tools You Can Manage</h2>
      <div className="tools-grid">
        {TOOLS.map((t) => (
          <div className="tool-card" key={t.name}>
            <div className="tool-icon">{t.icon}</div>
            <div className="tool-info">
              <h3>{t.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDocs() {
  const openDocs = () => open("https://comp-tech-guy.github.io/Kalam/docs/index.html");
  const openDiscord = () => open("https://discord.gg/EApJY56M8h");

  return (
    <div className="step-content" key="docs">
      <h2 className="step-title">Need Help?</h2>
      <div className="help-cards">
        <button
          className="help-card"
          id="ob-docs-link"
          onClick={openDocs}
        >
          <div className="help-icon">📖</div>
          <div className="help-info">
            <h3>Documentation</h3>
            <p>
              Read the full Kalam documentation to learn about advanced
              features, configuration guides, and troubleshooting tips.
            </p>
          </div>
          <span className="help-card-arrow">›</span>
        </button>
        <button
          className="help-card"
          id="ob-discord-link"
          onClick={openDiscord}
        >
          <div className="help-icon">💬</div>
          <div className="help-info">
            <h3>Discord Server</h3>
            <p>
              Join our community on Discord to ask questions, share your setups,
              and get help from other users and the developers.
            </p>
          </div>
          <span className="help-card-arrow">›</span>
        </button>
      </div>
    </div>
  );
}

function StepTour() {
  return (
    <div className="step-content" key="tour">
      <h2 className="step-title">Your Workspace</h2>
      <div className="tour-items">
        {TOUR_ITEMS.map((item) => (
          <div className="tour-item" key={item.label}>
            <div className="tour-icon">{item.icon}</div>
            <div className="tour-info">
              <h3>{item.label}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepFinal({ onComplete }) {
  const navigate = useNavigate();

  const finish = async (dest) => {
    await onComplete();
    navigate(dest);
  };

  return (
    <div className="step-content" key="final">
      <div className="final-icon">
        <div className="final-icon-inner">🚀</div>
      </div>
      <h2 className="step-title">Ready to Get Started?</h2>
      <p className="final-desc">
        Create your first profile to bundle your desktop configuration. You can
        always edit it later.
      </p>
      <div className="final-actions">
        <button
          id="ob-create-profile"
          className="btn-ob-primary"
          onClick={() => finish("/profile")}
        >
          Create My First Profile
        </button>
        <button
          id="ob-go-dashboard"
          className="btn-ob-secondary"
          onClick={() => finish("/")}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main Onboarding Component ───────────────────────────────────────────────

function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = async () => {
    await setOnboardingComplete(true);
    onDone();
  };

  const handleSkip = async () => {
    await handleComplete();
    navigate("/");
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const isLast = step === TOTAL_STEPS;

  const renderStep = () => {
    switch (step) {
      case 1: return <StepWelcome />;
      case 2: return <StepTools />;
      case 3: return <StepDocs />;
      case 4: return <StepTour />;
      case 5: return <StepFinal onComplete={handleComplete} />;
      default: return null;
    }
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Onboarding wizard">
      <div className="onboarding-card">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        {renderStep()}

        {/* Footer nav — hidden on final step since it has its own CTAs */}
        {!isLast && (
          <div className="onboarding-footer">
            <button
              className="footer-skip"
              onClick={handleSkip}
              id="ob-skip-btn"
            >
              Skip setup
            </button>
            <div className="footer-nav">
              {step > 1 && (
                <button className="btn-ob-back" onClick={back} id="ob-back-btn">
                  ← Back
                </button>
              )}
              <button
                className="btn-ob-primary"
                onClick={next}
                id="ob-next-btn"
              >
                {step === 1 ? "Get Started →" : "Next →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
