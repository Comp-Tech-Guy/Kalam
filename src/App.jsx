import { useState, useEffect } from "react";
import "./App.css";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Command } from '@tauri-apps/plugin-shell';
import { listen } from "@tauri-apps/api/event";
import { app } from "@tauri-apps/api";


async function runSidecar() {
  const command = Command.sidecar('binaries/my-sidecar/api');
  const output = await command.execute();
  return output.stdout;
}


function App() {
  const [name, setName] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);

  async function handleClick() {
    setButtonClicked(true);
    const res = await runSidecar();
    setMsg(res);
    setTimeout(() => setButtonClicked(false), 1000);
  }

  const appWindow = getCurrentWindow();

  const changeMax = async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
    setIsMaximized(!isMaximized);
  };

  // Listen to window resize events to update isMaximized state to change Icon
  useEffect(() => {
    function handleResize() {
      appWindow.isMaximized().then((newState) => setIsMaximized(newState));
    }
    handleResize();

    const unlisten = appWindow.listen('tauri://resize', async () => {
      handleResize();
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, []);


  // Titlebar button functionality
  useEffect(() => {
    const minimize = document.getElementById("titlebar-minimize");
    const maximize = document.getElementById("titlebar-maximize");
    const close = document.getElementById("titlebar-close");

    if (!minimize || !close) return;

    const onMinimize = () => appWindow.minimize();
    const onMaximize = () => changeMax(maximize);
    const onClose = () => appWindow.close();

    maximize.addEventListener("click", onMaximize);
    minimize.addEventListener("click", onMinimize);
    close.addEventListener("click", onClose);

    // cleanup (VERY important)
    return () => {
      minimize.removeEventListener("click", onMinimize);
      maximize.removeEventListener("click", onMaximize);
      close.removeEventListener("click", onClose);
    };
  }, []);

  return (
    <main className="container" >
      <div className="titlebar" data-tauri-drag-region>
        <div className="app-icon">
          <svg width="30" height="30" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M200 350L40 270L200 190L360 270L200 350Z" fill="#1A1D23" />

            <path d="M200 295L40 215L200 135L360 215L200 295Z" fill="#334155" />

            <path d="M200 240L55 167.5L200 95L345 167.5L200 240Z" stroke="#00F5D4" stroke-width="8" stroke-linejoin="round" />

            <path d="M200 190L40 110L200 30L360 110L200 190Z" fill="#E2E8F0" />

            <defs>
              <filter id="glow" x="0" y="0" width="400" height="400" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </svg>
        </div>
        <div class="controls">
          <button id="titlebar-minimize" title="minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-minus"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button id="titlebar-maximize" title="maximize">
            {isMaximized ? (
              /* RESTORE ICON */
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5H17C18.1 5 19 5.9 19 7V16"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round" />

                <rect x="5" y="8" width="11" height="11" rx="2" stroke="white" stroke-width="2" />
              </svg>
            ) : (
              /* MAXIMIZE ICON */
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="2" stroke="white" stroke-width="2" />
              </svg>
            )}
          </button>
          <button id="titlebar-close" title="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      {/* <div className="Menu-Left">
        <h1>Kalam App</h1>
      </div> */}
    </main>
  );
}

export default App;
