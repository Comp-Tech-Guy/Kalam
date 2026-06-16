import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setOnboardingComplete } from "../../services/storage";
import "./Onboarding.css";

// ─── Data ────────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    icon: "🌧️",
    name: "Rainmeter",
    desc: "Load and switch Rainmeter layouts per profile.",
  },
  {
    icon: "📊",
    name: "YASB",
    desc: "Inject custom config.yaml and styles.css.",
  },
  {
    icon: "🪟",
    name: "GlazeWM",
    desc: "Write config.yaml and restart the window manager.",
  },
  {
    icon: "📌",
    name: "Zebar",
    desc: "Write settings.json and restart the process.",
  },
  {
    icon: "🔧",
    name: "Windhawk",
    desc: "Enable/disable mods and apply settings via registry.",
  },
  {
    icon: "🖼️",
    name: "Wallpaper",
    desc: "Set your desktop wallpaper per profile.",
  },
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

// ─── Logo SVG (reused from AppLayout) ────────────────────────────────────────

function KalamLogo({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M200 350L40 270L200 190L360 270L200 350Z" fill="#1A1D23" />
      <path d="M200 295L40 215L200 135L360 215L200 295Z" fill="#334155" />
      <path
        d="M200 240L55 167.5L200 95L345 167.5L200 240Z"
        stroke="#19f5de"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M200 190L40 110L200 30L360 110L200 190Z" fill="#E2E8F0" />
    </svg>
  );
}

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
          <KalamLogo size={44} />
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
              <p>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDocs() {
  return (
    <div className="step-content" key="docs">
      <h2 className="step-title">Need Help?</h2>
      <div className="help-cards">
        <a
          className="help-card"
          href="https://github.com/Comp-Tech-Guy/Kalam"
          target="_blank"
          rel="noreferrer"
          id="ob-docs-link"
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
        </a>
        <a
          className="help-card"
          href="#"
          target="_blank"
          rel="noreferrer"
          id="ob-discord-link"
          onClick={(e) => e.preventDefault()}
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
        </a>
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
                onClick={step === 1 ? next : next}
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
