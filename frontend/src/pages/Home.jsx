import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import "../wavelength.css";
import "./Home.css";
import "./template.css";

import { generatePages } from "../pageGenerator.js";
import { submitConfession } from "../submit.js";
import { downloadPages } from "../download.js";
import { searchRecipient } from "../searchRecipient.js";
import { connectSocket } from "../socket";

const API = import.meta.env.VITE_BACKEND_URL;

function SignalMarkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="18"
        r="1.6"
        fill="currentColor"
        stroke="none"
      />
      <path d="M8.5 14.5a5 5 0 0 1 7 0" />
      <path d="M5.5 11.5a9 9 0 0 1 13 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.5-2.8 8.3-7 10-4.2-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform .2s ease",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const MOODS = [
  {
    id: "signal",
    label: "Mystery",
    file: "/wavelength-template-signal.png",
  },
  {
    id: "love",
    label: "Love",
    file: "/wavelength-template-love.png",
  },
  {
    id: "funny",
    label: "Funny",
    file: "/wavelength-template-funny.png",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const [anonymousProfile] = useState(() => {
    const stored = localStorage.getItem("anonymousProfile");
    return stored ? JSON.parse(stored) : null;
  });

  const [to, setTo] = useState("");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  const [recipientStatus, setRecipientStatus] = useState(null);
  const [allowPending, setAllowPending] = useState(false);
  const [publicConsent, setPublicConsent] = useState(false);

  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mood, setMood] = useState("signal");

  const [showMore, setShowMore] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

useEffect(() => {
  if (!showPreview) return;

  const renderPreview = () => {
    generatePages(to, from, message, mood);

    requestAnimationFrame(() => {
      const wrapper = document.getElementById("previewWrapper");

      if (!wrapper) return;

      const pages = wrapper.querySelectorAll(".template");

      pages.forEach((page) => {
        const availableWidth =
          wrapper.clientWidth - 16;

        const availableHeight =
          window.innerHeight * 0.70;

        const pageWidth = page.offsetWidth;
        const pageHeight = page.offsetHeight;

        if (!pageWidth || !pageHeight) return;

        const scale = Math.min(
          availableWidth / pageWidth,
          availableHeight / pageHeight,
          1
        );

        page.style.transform = `scale(${scale})`;

        /*
         * Transform doesn't affect normal layout size,
         * so compensate for the scaled height.
         */
        page.style.marginBottom =
          `${-(pageHeight * (1 - scale))}px`;
      });
    });
  };

  document.fonts.ready.then(() => {
    requestAnimationFrame(renderPreview);
  });
}, [to, from, message, mood, showPreview]);

  const verifyRecipient = async () => {
    if (!recipientUsername.trim()) {
      alert("Enter recipient Instagram username.");
      return;
    }

    try {
      setCheckingRecipient(true);

      const result = await searchRecipient(recipientUsername);

      setRecipientStatus(result.data);
      setAllowPending(false);
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to verify recipient.");
    } finally {
      setCheckingRecipient(false);
    }
  };

  const handleSubmit = async () => {
    if (!recipientStatus) {
      alert("Please verify the recipient first.");
      return;
    }

    if (!message.trim()) {
      alert("Message is required.");
      return;
    }

    if (!recipientStatus.exists && !allowPending) {
      alert("This recipient hasn't joined yet. Click Send Anyway first.");
      return;
    }

    try {
      setSubmitting(true);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const data = await submitConfession(
        recipientUsername,
        to,
        message,
        from,
        !recipientStatus.exists,
        publicConsent,
        mood
      );

      console.log("CONFESSION CREATED:", data);

      alert(
        recipientStatus.exists
          ? "Confession submitted!"
          : "Confession saved! It will be delivered if they join within 7 days."
      );

      setTo("");
      setRecipientUsername("");
      setMessage("");
      setFrom("");
      setRecipientStatus(null);
      setAllowPending(false);
      setPublicConsent(false);
      setShowMore(false);
      setShowPreview(false);
      setMood("signal");
    } catch (error) {
      console.error("SUBMIT CONFESSION ERROR:", error);
      alert(error.message || "Unable to submit confession.");
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * AUTH GATE
   */
  if (!user) {
    return (
      <div className="wl-auth-gate">
        <div className="wl-auth-gate__card wl-card wl-fade-up">
          <div className="wl-auth-gate__mark">
            <SignalMarkIcon />
          </div>

          <h2 className="wl-display">Log in to confess</h2>

          <p className="wl-auth-gate__sub">
            One tap with Google — quick, then straight to sending.
          </p>

          <div className="wl-auth-gate__google">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await fetch(`${API}/api/v1/auth/google`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      credential: credentialResponse.credential,
                    }),
                  });

                  const data = await res.json();

                  if (!data.success) {
                    alert(data.message);
                    return;
                  }

                  localStorage.setItem("token", data.data.token);
                  localStorage.setItem(
                    "user",
                    JSON.stringify(data.data.user)
                  );

                  connectSocket();

                  window.location.reload();
                } catch (err) {
                  console.error(err);
                  alert("Login failed");
                }
              }}
              onError={() => {
                alert("Google Login Failed");
              }}
            />
          </div>

          <button
            className="wl-btn wl-btn-ghost"
            onClick={() => navigate("/inbox")}
          >
            Go to inbox instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-confess wl-fade-up">

      {/* USER IDENTITY */}
      <div className="wl-confess__you">
        <div className="wl-confess__you-mark">
          <SignalMarkIcon />
        </div>

        <div>
          <div className="wl-confess__you-label">
            SENDING AS
          </div>

          <div className="wl-confess__you-name">
            {anonymousProfile?.anonymousName || "Anonymous"}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="wl-confess__hero">
        <span className="wl-eyebrow">
          <span className="wl-pulse-dot" />
          ANONYMOUS TRANSMISSION
        </span>

        <h1 className="wl-display wl-confess__heading">
          Say it.
          <br />
          Stay unknown.
        </h1>

        <p className="wl-confess__intro">
          Some things are easier to say when nobody knows
          who said them.
        </p>
      </section>

      {/* RECIPIENT */}
      <section className="wl-section">
        <label className="wl-field-label">
          Who is this for?
        </label>

        <div className="wl-input-row wl-recipient-input">
          <span className="wl-input-row__prefix">@</span>

          <input
            type="text"
            value={recipientUsername}
            onChange={(e) => {
              setRecipientUsername(e.target.value);
              setRecipientStatus(null);
              setAllowPending(false);
              setPublicConsent(false);
            }}
            placeholder="their_username"
            autoComplete="off"
          />

          {recipientStatus?.exists && (
            <span className="wl-recipient-check">✓</span>
          )}
        </div>

        {!recipientStatus && (
          <button
            className="wl-btn wl-btn-outline wl-confess__verify-btn"
            onClick={verifyRecipient}
            disabled={checkingRecipient}
          >
            {checkingRecipient
              ? "Checking..."
              : "Check recipient"}
          </button>
        )}

        {recipientStatus?.exists && (
          <div className="wl-success-message">
            <span>✓</span>
            They're on Wavelength. You're good to go.
          </div>
        )}

        {recipientStatus && !recipientStatus.exists && (
          <div className="wl-status-card">
            <p>
              They haven't joined yet. We'll hold this for 7 days
              and deliver it if they join.
            </p>

            <button
              className="wl-btn wl-btn-outline"
              onClick={() => setAllowPending(true)}
            >
              Send anyway
            </button>
          </div>
        )}
      </section>

      {/* MESSAGE */}
      <section className="wl-section wl-message-section">
        <div className="wl-section-heading">
          <label className="wl-field-label">
            Say the thing
          </label>

          <span className="wl-section-hint">
            {message.length}/500
          </span>
        </div>

        <textarea
          className="wl-note"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say what you can't say out loud..."
          maxLength={500}
        />
      </section>

      {/* MOOD */}
      <section className="wl-section">
        <label className="wl-field-label">
          What's the vibe?
        </label>

        <div className="wl-mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`wl-mood-chip ${
                mood === m.id ? "active" : ""
              }`}
              onClick={() => setMood(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* OPTIONAL DETAILS */}
      <button
        type="button"
        className="wl-disclosure"
        onClick={() => setShowMore((v) => !v)}
      >
        <span>
          {showMore
            ? "Hide extra details"
            : "+ Add a hint or context"}
        </span>

        <ChevronIcon open={showMore} />
      </button>

      {showMore && (
        <div className="wl-disclosure__body wl-fade-up">

          <label className="wl-field-label">
            Hint
            <span className="wl-field-label__optional">
              optional
            </span>
          </label>

          <input
            type="text"
            className="wl-plain-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. Someone special"
          />

          <label className="wl-field-label">
            From
            <span className="wl-field-label__optional">
              optional
            </span>
          </label>

          <textarea
            className="wl-plain-textarea"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="B3 Division"
          />
        </div>
      )}

      {/* PUBLIC SHARING */}
      {recipientStatus && (
        <label className="wl-seal-row">
          <input
            type="checkbox"
            checked={publicConsent}
            onChange={(e) =>
              setPublicConsent(e.target.checked)
            }
          />

          <span className="wl-seal-box">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
            >
              <path d="M4 12l5 5L20 6" />
            </svg>
          </span>

          <span className="wl-seal-label">
            I'm okay with this being shared publicly if
            they also choose to share it.
          </span>
        </label>
      )}

      {/* SEND */}
      <button
        className="wl-btn wl-btn-primary wl-btn-block wl-confess__submit"
        disabled={
          !recipientStatus ||
          checkingRecipient ||
          submitting ||
          !message.trim() ||
          (!recipientStatus.exists && !allowPending)
        }
        onClick={handleSubmit}
      >
        {submitting
          ? "Sending..."
          : "Send it anonymously →"}
      </button>

      <p className="wl-confess__footer-note">
        Someone on your campus might be thinking about you too.
      </p>

      {/* PREVIEW */}
      <button
  type="button"
  className="wl-disclosure wl-preview-trigger"
  onClick={() => setShowPreview(true)}
>
  <span>Preview your postcard</span>

  <span className="wl-preview-arrow">↗</span>
</button>

{showPreview && (
  <div
    className="wl-preview-modal"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        setShowPreview(false);
      }
    }}
  >
    <div className="wl-preview-modal__content">

      {/* HEADER */}
      <div className="wl-preview-modal__header">
        <div>
          <span className="wl-preview-modal__eyebrow">
            POSTCARD PREVIEW
          </span>

          <h2 className="wl-preview-modal__title">
            Your transmission
          </h2>
        </div>

        <button
          type="button"
          className="wl-preview-modal__close"
          onClick={() => setShowPreview(false)}
          aria-label="Close preview"
        >
          ×
        </button>
      </div>

      {/* FULL PREVIEW */}
      <div className="wl-preview-modal__stage">
        <div
          className="preview-wrapper"
          id="previewWrapper"
        />
      </div>

      {/* ACTIONS */}
      <div className="wl-preview-modal__actions">

        <button
          className="wl-btn wl-btn-outline"
          onClick={() => setShowPreview(false)}
        >
          Back
        </button>

        <button
          className="wl-btn wl-btn-primary"
          onClick={downloadPages}
        >
          Save image ↓
        </button>

      </div>

    </div>
  </div>
)}

      {/* HIDDEN TEMPLATE — KEEP FOR IMAGE GENERATION */}
      <div
        className="template"
        id="template"
        style={{
          display: "none",
          backgroundImage: `url(${
            MOODS.find((m) => m.id === mood).file
          })`,
        }}
      >
        <div className="to">
          <span className="tpl-label">To,</span>
          <h2 className="previewTo">Someone</h2>
        </div>

        <div className="message"></div>

        <div className="from">
          <span className="tpl-label">From,</span>
          <h3 className="previewFrom">Unknown</h3>
        </div>
      </div>
    </div>
  );
}