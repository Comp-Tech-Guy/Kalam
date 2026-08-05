import { useState, useEffect, useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getLastUpdateCheck, recordUpdateCheck } from "./storage";

const CHECK_TIMEOUT_MS = 5_000;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function useUpdateChecker() {
  const [update, setUpdate] = useState(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdates = useCallback(async () => {
    const lastCheck = await getLastUpdateCheck();
    if (lastCheck && Date.now() - lastCheck < CHECK_INTERVAL_MS) {
      setStatus("uptodate");
      return "uptodate";
    }
    try {
      setStatus("checking");
      const result = await check({ timeout: CHECK_TIMEOUT_MS });
      if (result) {
        setUpdate(result);
        setStatus("available");
        setDismissed(false);
        await recordUpdateCheck();
        return "available";
      }
      setUpdate(null);
      setStatus("uptodate");
      await recordUpdateCheck();
      return "uptodate";
    } catch {
      setStatus("error");
      return "error";
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const downloadUpdate = useCallback(async () => {
    if (!update) return;
    try {
      setStatus("downloading");
      setProgress(0);
      let downloadedSoFar = 0;
      let totalLength = 0;
      await update.download((event) => {
        if (event.event === "Started") {
          setProgress(0);
          downloadedSoFar = 0;
          totalLength = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloadedSoFar += event.data.chunkLength;
          if (totalLength > 0) {
            setProgress(Math.min(downloadedSoFar / totalLength, 1));
          }
        } else if (event.event === "Finished") {
          setProgress(1);
        }
      });
      setStatus("downloaded");
    } catch {
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
    } catch {
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
