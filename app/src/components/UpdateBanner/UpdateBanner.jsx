import "./UpdateBanner.css";
import { useUpdateChecker } from "../../services/useUpdateChecker";

function UpdateBanner({ onManualCheck }) {
  const {
    update,
    status,
    progress,
    dismissed,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismiss,
  } = useUpdateChecker();

  if (dismissed || status === "idle" || status === "uptodate" || status === "checking") {
    return null;
  }

  if (status === "available" && update) {
    return (
      <div className="update-banner">
        <div className="update-banner-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
          </svg>
          <div className="update-banner-text">
            <strong>Update available</strong>
            <span>v{update.version} — {update.notes?.split('.')[0] || 'New version available'}.</span>
          </div>
          <button className="update-btn update-btn-primary" onClick={downloadUpdate}>
            Download
          </button>
          <button className="update-btn update-btn-dismiss" onClick={dismiss}>
            Later
          </button>
        </div>
      </div>
    );
  }

  if (status === "downloading") {
    return (
      <div className="update-banner">
        <div className="update-banner-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <div className="update-banner-text">
            <strong>Downloading update...</strong>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="update-progress-bar">
            <div className="update-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (status === "downloaded") {
    return (
      <div className="update-banner">
        <div className="update-banner-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div className="update-banner-text">
            <strong>Download complete</strong>
            <span>Restart to install v{update?.version}.</span>
          </div>
          <button className="update-btn update-btn-primary" onClick={installUpdate}>
            Restart & Install
          </button>
          <button className="update-btn update-btn-dismiss" onClick={dismiss}>
            Later
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default UpdateBanner;
