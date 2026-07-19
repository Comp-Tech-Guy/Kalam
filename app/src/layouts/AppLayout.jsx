import { useState, useEffect, Suspense, lazy } from "react";
import "./AppLayout.css";
import logo from "../assets/kalam-icon.png";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { initializeFS, getData } from '../services/storage';
import { NavLink, Outlet } from "react-router-dom";
import UpdateBanner from '../components/UpdateBanner/UpdateBanner';

const Onboarding = lazy(() => import('../pages/Onboarding/Onboarding'));

function AppLayout() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    async function init() {
      await initializeFS();
      const settings = await getData('userSettings.json', true);
      if (settings && settings.onboardingComplete === false) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
    init();
  }, []);

  const appWindow = getCurrentWindow();

  const onMinimize = () => appWindow.minimize();
  const onMaximize = async () => {
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
    setIsMaximized(!maximized);
  };
  const onClose = () => appWindow.close();

  useEffect(() => {
    function handleResize() {
      appWindow.isMaximized().then(setIsMaximized);
    }
    handleResize();

    const unlisten = appWindow.listen('tauri://resize', handleResize);
    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  if (showOnboarding === null) {
    return <main className="container" />;
  }

  return (
    <main className="container" >
      {showOnboarding && (
        <Suspense fallback={<div className="loader" />}>
          <Onboarding onDone={() => setShowOnboarding(false)} />
        </Suspense>
      )}
      <div className="titlebar" data-tauri-drag-region>
        <div className="app-icon">
          <img src={logo} height={25} alt="kalam" />
        </div>
        <div className="controls">
          <button onClick={onMinimize} title="minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button onClick={onMaximize} title="maximize">
            {isMaximized ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5H17C18.1 5 19 5.9 19 7V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="5" y="8" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            )}
          </button>
          <button className="titlebar-close" onClick={onClose} title="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <main className="MainPg">
        <nav>

          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>New Profile</span>
          </NavLink>
          <NavLink to="/setting" className={({ isActive }) => isActive ? "active" : ""}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>Settings</span>
          </NavLink>
          <div className="nav-divider" />
        </nav>
        <div className="PageContainer">
          <Outlet />
        </div>
      </main>
      <UpdateBanner />
    </main>
  );
}

export default AppLayout;
