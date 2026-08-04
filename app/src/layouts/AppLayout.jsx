import { useState, useEffect, Suspense, lazy } from "react";
import "./AppLayout.css";
import logo from "../assets/kalam-icon.png";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { initializeFS, getData, resolveTheme } from '../services/storage';
import { NavLink, Outlet } from "react-router-dom";
import UpdateBanner from '../components/UpdateBanner/UpdateBanner';
import About from '../components/About/About';

const Onboarding = lazy(() => import('../pages/Onboarding/Onboarding'));

function AppLayout() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initializeFS();
      const settings = await getData('userSettings.json', true);

      // Apply theme
      const theme = settings?.theme || 'system';
      document.documentElement.setAttribute('data-theme', resolveTheme(theme));

      if (settings && settings.onboardingComplete === false) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
      } catch (e) {
        console.warn("App init failed:", e);
        setShowOnboarding(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onSystemThemeChange = async () => {
      const latest = await getData('userSettings.json', true);
      const current = latest?.theme || 'system';
      if (current === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme(current));
      }
    };
    media.addEventListener('change', onSystemThemeChange);
    return () => media.removeEventListener('change', onSystemThemeChange);
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
    <main className="container">
      {showOnboarding && (
        <Suspense fallback={<div className="loader" />}>
          <Onboarding onDone={() => setShowOnboarding(false)} />
        </Suspense>
      )}

      {/* ─── Top Bar ────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-brand" onClick={() => setShowAbout(true)}>
          <img src={logo} height={22} alt="kalam" />
        </div>

        <div className="topbar-nav" data-tauri-drag-region>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/profile">New Profile</NavLink>
          <NavLink to="/setting">Settings</NavLink>
        </div>

        <div className="topbar-controls">
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
          <button className="topbar-close" onClick={onClose} title="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {/* ─── Page Content ───────────────────────────────────── */}
      <main className="MainPg">
        <div className="PageContainer">
          <Outlet />
        </div>
      </main>

      <UpdateBanner />
      <About open={showAbout} onClose={() => setShowAbout(false)} />
    </main>
  );
}

export default AppLayout;
