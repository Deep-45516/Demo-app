//home.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { disconnectSocket } from "../socket";

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
      <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <path d="M8.5 14.5a5 5 0 0 1 7 0" />
      <path d="M5.5 11.5a9 9 0 0 1 13 0" />
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
  { id: "signal", label: "Mystery", file: "/wavelength-template-signal.png" },
  { id: "love", label: "Love", file: "/wavelength-template-love.png" },
  { id: "funny", label: "Funny", file: "/wavelength-template-funny.png" },
];

export default function Home() {
  const navigate = useNavigate();
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    navigate("/instagram", { replace: true });
  }

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
  const [validationError, setValidationError] = useState("");

  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mood, setMood] = useState("signal");

  const [showMore, setShowMore] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Only build the postcard preview while it's actually being looked at.
  useEffect(() => {
    if (!showPreview) return;

    const timer = setTimeout(() => {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          generatePages(to, from, message, mood);
        });
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [to, from, message, mood, showPreview]);

  // Fixes the "preview cut off" issue: instead of guessing the scale
  // from raw viewport width (which doesn't know about the modal's own
  // padding), measure the actual visible stage and scale to fit it
  // exactly. clientWidth/clientHeight of the underlying 500x706 box
  // are untouched by this, so text-fit still matches the backend 1:1.
  const stageRef = useRef(null);
  useEffect(() => {
    if (!showPreview || !stageRef.current) return;

    const stage = stageRef.current;

    function updateScale() {
      const wrapper = document.getElementById("previewWrapper");
      if (!wrapper) return;
      const available = stage.clientWidth - 8;
      const scale = Math.min(1, available / 500);
      wrapper.style.setProperty("--pc-scale", scale);
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);

    return () => observer.disconnect();
  }, [showPreview]);

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
  setValidationError("");

  if (!recipientUsername.trim()) {
    setValidationError("Please enter the Instagram username.");
    return;
  }

  if (!recipientStatus) {
    setValidationError("Please verify the Instagram username before sending.");
    return;
  }

  if (!message.trim()) {
    setValidationError("Please write something before sending.");
    return;
  }

  if (!recipientStatus.exists && !allowPending) {
    setValidationError("Please choose “Send Anyway” before sending.");
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
        mood,
      );

      console.log("CONFESSION CREATED:", data);

      alert(
        recipientStatus.exists
          ? "Confession submitted!"
          : "Confession saved! It will be delivered if they join within 7 days.",
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

  if (!user) {
    return (
      <div className="wl-auth-gate">
        <div className="wl-auth-gate__card wl-card wl-fade-up">
          <div className="wl-auth-gate__mark">
            <SignalMarkIcon />
          </div>
          <h2 className="wl-display">Log in to confess</h2>
          <p className="wl-auth-gate__sub">One tap with Google.</p>

          <div className="wl-auth-gate__google">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await fetch(`${API}/api/v1/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
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
                  localStorage.setItem("user", JSON.stringify(data.data.user));

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
      <div className="wl-confess__you">
        <div className="wl-confess__you-mark">
          <SignalMarkIcon />
        </div>
        <div className="wl-confess__you-name">
          {anonymousProfile?.anonymousName || "Anonymous"}
        </div>
      </div>
      <button
        className="wl-shell__logout"
        onClick={logout}
        aria-label="Log out"
      >
        <LogoutIcon />
      </button>
      <header className="wl-shell__header"></header>

      {/* <h1 className="wl-display wl-confess__heading">Say it, stay unknown.</h1> */}

      {/* RECIPIENT */}
      <section className="wl-section">
        <label className="wl-field-label">Who's this for?</label>

        <div
          className={`wl-input-row ${recipientStatus?.exists ? "is-verified" : ""}`}
        >
          <span className="wl-input-row__prefix">@</span>

          <input
            type="text"
            value={recipientUsername}
            onChange={(e) => {
              setRecipientUsername(e.target.value);
              setRecipientStatus(null);
              setAllowPending(false);
              setPublicConsent(false);
              setValidationError("");
            }}
            placeholder="their_Insta"
            autoComplete="off"
          />

          <button
  type="button"
  className={`wl-btn wl-btn-primary wl-btn-block wl-confess__submit ${
    !recipientStatus ||
    !message.trim() ||
    (!recipientStatus?.exists && !allowPending)
      ? "is-disabled"
      : ""
  }`}
  disabled={checkingRecipient || submitting}
  onClick={handleSubmit}
>
  {submitting ? "Sending..." : "Send it anonymously"}
</button>
          {validationError && (
  <div className="wl-confess__validation-error" role="alert">
    ⚠ {validationError}
  </div>
)}
        </div>

        {recipientStatus?.exists && (
          <div className="wl-success-message">
            <span>✓</span> They're on Wavelength.
          </div>
        )}

        {recipientStatus && !recipientStatus.exists && (
          <div className="wl-status-card">
            <p>
              Not on Wavelength yet — we'll hold this 7 days and deliver it if
              they join.
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
        {/* <label className="wl-field-label">Say the thing</label> */}
        <div className="wl-note-wrapper">
          <textarea
            className="wl-note"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say what you can't say out loud..."
          />

          <button
            type="button"
            className="wl-floating-preview"
            onClick={() => setShowPreview(true)}
            aria-label="Preview postcard"
            title="Preview postcard"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.8" />
            </svg>
          </button>
        </div>
      </section>

      {/* MOOD */}
      <section className="wl-section">
        <label className="wl-field-label">What's the vibe?</label>
        <div className="wl-mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`wl-mood-chip ${mood === m.id ? "active" : ""}`}
              onClick={() => setMood(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="wl-disclosure"
        onClick={() => setShowMore((v) => !v)}
      >
        <span>
          {showMore ? "Hide extra details" : "+ Add a hint or context"}
        </span>
        <ChevronIcon open={showMore} />
      </button>

      {showMore && (
        <div className="wl-disclosure__body wl-fade-up">
          <label className="wl-field-label">
            Hint <span className="wl-field-label__optional">optional</span>
          </label>
          <input
            type="text"
            className="wl-plain-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. SY B3 CSE"
          />

          <label className="wl-field-label">
            From <span className="wl-field-label__optional">optional</span>
          </label>
          <textarea
            className="wl-plain-textarea"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="A.....a"
          />
        </div>
      )}

      {recipientStatus && (
        <label className="wl-seal-row">
          <input
            type="checkbox"
            checked={publicConsent}
            onChange={(e) => setPublicConsent(e.target.checked)}
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
            I'm okay to share publicly if they agree too.
          </span>
        </label>
      )}

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
        {submitting ? "Sending..." : "Send it anonymously"}
      </button>

      {showPreview && (
        <div
          className="wl-preview-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreview(false);
          }}
        >
          <div className="wl-preview-modal__content">
            <div className="wl-preview-modal__header">
              <h2 className="wl-preview-modal__title wl-display">
                Your transmission
              </h2>
              <button
                type="button"
                className="wl-preview-modal__close"
                onClick={() => setShowPreview(false)}
              >
                ×
              </button>
            </div>

            <div className="wl-preview-modal__stage" ref={stageRef}>
              <div className="preview-wrapper" id="previewWrapper" />
            </div>

            <div className="wl-preview-modal__actions">
              <button
                className="wl-btn wl-btn-outline"
                onClick={() => setShowPreview(false)}
              >
                Back
              </button>
              <button className="wl-btn wl-btn-primary" onClick={downloadPages}>
                Save image
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="template"
        id="template"
        style={{
          display: "none",
          backgroundImage: `url(${MOODS.find((m) => m.id === mood).file})`,
        }}
      >
        <div className="to">
          <h2 className="previewTo">Someone</h2>
        </div>
        <div className="message"></div>
        <div className="from">
          <h3 className="previewFrom">Unknown</h3>
        </div>
      </div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
