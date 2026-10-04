// frontend/src/pages/InstallButton.jsx
import { useEffect, useState } from "react";
import {
  subscribeInstallAvailability,
  promptPwaInstall,
  isIOSSafariBrowser,
  getDisplayMode,
  trackOnce,
} from "../analytics.js";

export default function InstallButton({ placement = "home" }) {
  const [canInstall, setCanInstall] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  const alreadyInstalled = getDisplayMode() === "standalone";
  const ios = isIOSSafariBrowser();

  useEffect(() => subscribeInstallAvailability(setCanInstall), []);

  // Count how many people were actually offered the button (the denominator)
  const visible = !alreadyInstalled && (canInstall || ios);
  useEffect(() => {
    if (visible) trackOnce("pwa_install_button_shown", { placement });
  }, [visible, placement]);

  if (!visible) return null; // already installed, or browser can't install

  // Android / desktop Chrome / Edge: real install prompt
  if (canInstall) {
    return (
      <button
        type="button"
        className="wl-btn wl-btn-outline wl-btn-block"
        style={{ marginTop: 12 }}
        onClick={() => promptPwaInstall(placement)}
      >
        📲 Add TBH to home screen
      </button>
    );
  }

  // iPhone Safari: no install API, so show the manual steps
  return (
    <>
      <button
        type="button"
        className="wl-btn wl-btn-outline wl-btn-block"
        style={{ marginTop: 12 }}
        onClick={() => setShowIOSHelp((v) => !v)}
      >
        📲 Add TBH to home screen
      </button>
      {showIOSHelp && (
        <p className="wl-mono" style={{ fontSize: 11, marginTop: 8, textAlign: "center" }}>
          Tap the Share icon in Safari, then "Add to Home Screen".
        </p>
      )}
    </>
  );
}
