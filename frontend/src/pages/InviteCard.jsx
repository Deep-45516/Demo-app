import { useCallback, useEffect, useState } from "react";
import "./InviteCard.css";

// Change to https://wit-tbh.vercel.app if t-b-h.in doesn't open the app yet
const INVITE_URL = "https://t-b-h.in";

// Pure FOMO about the app. None of these say a confession exists.
const STATIC_MESSAGES = [
  "WIT has an anonymous app now. Join before everyone knows more than you 👀",
  "Something's going around WIT and you're not on it yet 👀",
  "Anonymous. WIT-only. Already moving. Get in 👇",
  "One by one, WIT is getting on TBH. Don't be the last 😏",
];

function pickMessage() {
  const candidates = [...STATIC_MESSAGES];

  // Real number as proof, only when it's big enough to impress
  const saved = Number(localStorage.getItem("confessionCount"));
  if (Number.isFinite(saved) && saved >= 50) {
    const rounded = Math.floor(saved / 10) * 10;
    candidates.push(
      `${rounded.toLocaleString("en-IN")}+ anonymous confessions already sent at WIT. You're not in yet 👀`,
    );
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

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
  const [text] = useState(pickMessage);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200);
  }, [closing, onClose]);

  useEffect(() => {
    navigator.vibrate?.(15);

    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close]);

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
    <div
      className={`invite-overlay ${closing ? "is-closing" : ""}`}
      onClick={close}
    >
      <div
        className="invite-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`invite-badge ${pending ? "is-pending" : ""}`}>
          {pending ? (
            "⏳"
          ) : (
            <svg viewBox="0 0 56 56" aria-hidden="true">
              <path d="M17 29l8 8 14-16" />
            </svg>
          )}
        </div>

        <h3 className="invite-title">
          {pending ? "It's waiting for them" : "Sent anonymously"}
        </h3>
        <p className="invite-sub">
          {pending
            ? "Not on TBH yet. It lands the moment they join (within 7 days)."
            : "Delivered. They'll never know it was you."}
        </p>

        <div className="invite-box">
          <p className="invite-box__label">
            {pending ? "GET THEM IN FASTER" : "BRING YOUR PEOPLE"}
          </p>
          <p className="invite-box__text">{text}</p>
          <p className="invite-box__link">t-b-h.in</p>

          <div className="invite-actions">
            <button type="button" className="invite-btn invite-btn--primary" onClick={handleShare}>
              <ShareIcon /> Share
            </button>
            <button type="button" className="invite-btn invite-btn--ghost" onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        </div>

        {pending && (
          <p className="invite-tip">
            Tip: drop it in a group or your story instead of DM-ing them.
            Keeps the mystery 🤫
          </p>
        )}

        <button type="button" className="invite-close" onClick={close}>
          Done
        </button>
      </div>
    </div>
  );
}