import { useEffect, useState } from "react";
import "./InviteCard.css";

// Change this if t-b-h.in doesn't point to the app yet (e.g. https://wit-tbh.vercel.app)
const INVITE_URL = "https://t-b-h.in";

// None of these mention confessions on purpose
const INVITE_MESSAGES = [
  "Make your secret name on TBH 👀 anonymous & only for WIT.",
  "TBH is live at WIT. Pick your secret name 🤫",
  "No Walls. No Cap. Find your secret name on TBH 👀",
  "Your secret name is waiting on TBH 😏",
];

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.6l6.8-4.2M8.6 13.4l6.8 4.2" />
    </svg>
  );
}

export default function InviteCard({ pending, onClose }) {
  const [text] = useState(
    () => INVITE_MESSAGES[Math.floor(Math.random() * INVITE_MESSAGES.length)],
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${text} ${INVITE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "TBH", text, url: INVITE_URL });
      } catch (e) {
        if (e?.name !== "AbortError") handleCopy();
      }
      return;
    }
    handleCopy(); // desktop fallback
  }

  return (
    <div className="invite-overlay" onClick={onClose}>
      <div
        className="invite-sheet wl-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="invite-title wl-display">
          {pending ? "Saved 🔒" : "Sent 💌"}
        </h3>
        <p className="invite-sub">
          {pending
            ? "They're not on TBH yet. We'll deliver it if they join within 7 days."
            : "Delivered anonymously."}
        </p>

        <div className="invite-box">
          <p className="invite-box__label wl-mono">INVITE YOUR PEOPLE</p>
          <p className="invite-box__text">{text}</p>
          <p className="invite-box__link wl-mono">t-b-h.in</p>

          <div className="invite-actions">
            <button type="button" className="wl-btn wl-btn-primary" onClick={handleShare}>
              <ShareIcon /> Share
            </button>
            <button type="button" className="wl-btn wl-btn-outline" onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        </div>

        {pending && (
          <p className="invite-tip">
            Tip: post it in a group or your story instead of DM-ing them
            directly. Keeps the mystery 🤫
          </p>
        )}

        <button type="button" className="invite-close" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}