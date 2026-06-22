import { useState, useEffect, useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

let manualTrigger = null;

export function requestManualCheck() {
  if (manualTrigger) manualTrigger();
}

export function useUpdateChecker() {
  const [update, setUpdate] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdates = useCallback(async () => {
    try {
      setStatus("checking");
      const result = await check();
      if (result) {
        setUpdate(result);
        setStatus("available");
        setDismissed(false);
      } else {
        setUpdate(null);
        setStatus("uptodate");
      }
    } catch (e) {
      console.error("Update check failed:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  useEffect(() => {
    manualTrigger = () => {
      setDismissed(false);
      checkForUpdates();
    };
    return () => { manualTrigger = null; };
  }, [checkForUpdates]);

  const downloadUpdate = useCallback(async () => {
    if (!update) return;
    try {
      setStatus("downloading");
      setProgress(0);
      await update.download((event) => {
        if (event.event === "Started") {
          setProgress(0);
        } else if (event.event === "Progress") {
          setProgress(event.data.chunkLength / event.data.contentLength);
        } else if (event.event === "Finished") {
          setProgress(1);
        }
      });
      setStatus("downloaded");
    } catch (e) {
      console.error("Download failed:", e);
      setStatus("error");
    }
  }, [update]);

  const installUpdate = useCallback(async () => {
    try {
      setStatus("installing");
      if (update) {
        await update.install();
        await relaunch();
      }
    } catch (e) {
      console.error("Install failed:", e);
      setStatus("error");
    }
  }, [update]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    update,
    status,
    progress,
    dismissed,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismiss,
  };
}
