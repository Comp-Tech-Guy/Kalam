import { useState, useEffect, useRef } from "react";
import "./AppLayout.css";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { initializeFS } from '../services/storage';
import { NavLink, Outlet } from "react-router-dom";

function AppLayout() {
  const [isMaximized, setIsMaximized] = useState(false);
  const minimizeRef = useRef(null);
  const maximizeRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    initializeFS()
  }, []);

  const appWindow = getCurrentWindow();

  const changeMax = async () => {
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
    setIsMaximized(!maximized);
  };

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

  useEffect(() => {
    const minBtn = minimizeRef.current;
    const maxBtn = maximizeRef.current;
    const clsBtn = closeRef.current;

    if (!minBtn || !maxBtn || !clsBtn) return;

    const onMinimize = () => appWindow.minimize();
    const onMaximize = () => changeMax();
    const onClose = () => appWindow.close();

    minBtn.addEventListener("click", onMinimize);
    maxBtn.addEventListener("click", onMaximize);
    clsBtn.addEventListener("click", onClose);

    return () => {
      minBtn.removeEventListener("click", onMinimize);
      maxBtn.removeEventListener("click", onMaximize);
      clsBtn.removeEventListener("click", onClose);
    };
  }, []);

  return (
    <main className="container" >
      <div className="titlebar" data-tauri-drag-region>
        <div className="app-icon">
          <svg width="24" height="24" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M200 350L40 270L200 190L360 270L200 350Z" fill="#1A1D23" />
            <path d="M200 295L40 215L200 135L360 215L200 295Z" fill="#334155" />
            <path d="M200 240L55 167.5L200 95L345 167.5L200 240Z" stroke="#19f5de" strokeWidth="8" strokeLinejoin="round" />
            <path d="M200 190L40 110L200 30L360 110L200 190Z" fill="#E2E8F0" />
          </svg>
        </div>
        <div className="controls">
          <button ref={minimizeRef} title="minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button ref={maximizeRef} title="maximize">
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
          <button ref={closeRef} title="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <main className="MainPg">
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            <div>Home</div>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
            <div>New Profile</div>
          </NavLink>
          <NavLink to="/setting" className={({ isActive }) => isActive ? "active" : ""}>
            <div>Settings</div>
          </NavLink>
        </nav>
        <div className="PageContainer">
          <Outlet />
        </div>
      </main>
    </main>
  );
}

export default AppLayout;
