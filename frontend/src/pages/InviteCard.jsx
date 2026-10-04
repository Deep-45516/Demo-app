import { useCallback, useEffect, useState } from "react";
import "./InviteCard.css";
import { track } from "../analytics.js";

// Use www directly so a domain redirect can't drop the ?utm params
const INVITE_BASE = "https://www.t-b-h.in";

// Pure FOMO about the app. None of these say a confession exists.
const STATIC_MESSAGES = [
  "Our college has anonymous app now. Join before it's too late 👀",
  "Something's going around our college & you're not on it yet 👀",
  "Anonymous app. live in our collge. Get in 👇",
  "Our college is getting on TBH. Don't be last 😏",
];

// ONE pickMessage only. Returns the text AND which variant it was.
function pickMessage() {
  const candidates = STATIC_MESSAGES.map((text, i) => ({
    text,
    variant: `static_${i}`,
  }));

  // Real number as proof, only when it's big enough to impress
  const saved = Number(localStorage.getItem("confessionCount"));
  if (Number.isFinite(saved) && saved >= 50) {
    const rounded = Math.floor(saved / 10) * 10;
    candidates.push({
      text: `${rounded.toLocaleString("en-IN")}+ anonymous confessions already sent at WIT. You're not in yet 👀`,
      variant: "count_proof",
    });
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function InviteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </svg>
  );
}

export default function InviteCard({ pending, onClose }) {
  const [picked] = useState(pickMessage);
  const text = picked.text;
  const variant = picked.variant;

  // Tagged link: lets GA4 show which invite message brings visitors in
  const inviteUrl = `${INVITE_BASE}/?utm_source=friend&utm_medium=share&utm_campaign=${
    pending ? "invite_pending" : "invite"
  }&utm_content=${variant}`;

  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (closing) return;
    track("invite_dismissed", { pending, variant });
    setClosing(true);
    setTimeout(onClose, 200);
  }, [closing, onClose, pending, variant]);

  useEffect(() => {
    track("invite_card_shown", { pending, variant });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      await navigator.clipboard.writeText(`${text} ${inviteUrl}`);
      setCopied(true);
      track("invite_shared", { method: "copy", pending, variant });
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "TBH", text, url: inviteUrl });
        track("invite_shared", { method: "native", pending, variant });
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
          {pending ? "waiting for them" : "Sent anonymously"}
        </h3>
        <p className="invite-sub">
          {pending ? "They will get it if they join within 7 days" : ""}
        </p>

        <div className="invite-box">
          <p className="invite-box__label">
            {pending ? "INVITE THEM" : "INVITE YOUR FRIENDS"}
          </p>
          <p className="invite-box__text">{text}</p>
          <p className="invite-box__link">t-b-h.in</p>

          <div className="invite-actions">
            <button type="button" className="invite-btn invite-btn--primary" onClick={handleShare}>
              <InviteIcon /> Invite
            </button>
            <button type="button" className="invite-btn invite-btn--ghost" onClick={handleCopy}>
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        </div>

        {pending && (
          <p className="invite-tip">
            Tip: drop it in a group instead of DM-ing them.
          </p>
        )}

        <button type="button" className="invite-close" onClick={close}>
          Done
        </button>
      </div>
    </div>
  );
}