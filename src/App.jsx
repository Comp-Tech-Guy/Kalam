import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Command } from '@tauri-apps/plugin-shell';


async function runSidecar() {
  const command = Command.sidecar('binaries/my-sidecar/api');
  const output = await command.execute();
  return output.stdout;
}


function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [msg, setMsg] = useState("");
  const [buttonClicked, setButtonClicked] = useState(false);
  
  async function handleClick() {
    setButtonClicked(true);
    const res = await runSidecar();
    setMsg(res);
    setTimeout(() => setButtonClicked(false), 1000);
  }

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
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

  useEffect(() => {
    appWindow.isMaximized().then(setIsMaximized);
  }, []);


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
    <main className="container">
      <div class="titlebar">
        <div data-tauri-drag-region></div>
        <div class="controls">
          <button id="titlebar-minimize" title="minimize">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-minus"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button id="titlebar-maximize" title="maximize">
            {isMaximized ? (
              /* RESTORE ICON */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              /* MAXIMIZE ICON */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          <button id="titlebar-close" title="close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      {/* <div>
        <button onClick={handleClick} disabled={buttonClicked}>Say Hi</button>
        <p>{msg}</p>
      </div> */}
    </main>
  );
}

export default App;
