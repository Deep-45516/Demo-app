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
import { connectSocket, disconnectSocket } from "../socket";

const API = import.meta.env.VITE_BACKEND_URL;

function SignalMarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <path d="M8.5 14.5a5 5 0 0 1 7 0" />
      <path d="M5.5 11.5a9 9 0 0 1 13 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-2.8 8.3-7 10-4.2-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Mood picker — changes which background the backend's image
// generator uses (see generateImages.js / THEME_FILES).
const MOODS = [
  { id: "signal", label: "Mystery", file: "/wavelength-template-signal.png" },
  { id: "love", label: "Love", file: "/wavelength-template-love.png" },
  { id: "funny", label: "Funny", file: "/wavelength-template-funny.png" },
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

  // UI-only state: purely controls what's shown, never affects what's submitted.
  const [showMore, setShowMore] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        generatePages(to, from, message, mood);
      });
    });
  }, [to, from, message, mood]);

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
    } finally {
      setCheckingRecipient(false);
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
          <p className="wl-auth-gate__sub">One tap with Google — quick, then straight to sending.</p>

          <div className="wl-auth-gate__google">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await fetch(`${API}/api/v1/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ credential: credentialResponse.credential }),
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

          <button className="wl-btn wl-btn-ghost" onClick={() => navigate("/inbox")}>
            Go to inbox instead
          </button>
        </div>
      </div>
    );
  }

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
    } catch (error) {
      console.error("SUBMIT CONFESSION ERROR:", error);
      alert(error.message || "Unable to submit confession.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wl-confess">
      <div className="wl-confess__you wl-fade-up">
        <div className="wl-confess__you-mark"><SignalMarkIcon /></div>
        <div>
          <div className="wl-confess__you-label">SENDING AS</div>
          <div className="wl-confess__you-name">
  {anonymousProfile?.anonymousName || "Anonymous"}
</div>
        </div>
      </div>

      <h1 className="wl-display wl-confess__heading">Say it. Stay unknown.</h1>

      <div className="wl-trust-banner">
        <ShieldIcon />
        <span>Only your anonymous name is ever shown — never your Instagram, unless you choose to reveal it later.</span>
      </div>

      <label className="wl-field-label">Recipient's Instagram username</label>
      <div className="wl-input-row">
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
          placeholder="their_instagram_username"
        />
      </div>

      <button className="wl-btn wl-btn-outline wl-confess__verify-btn" onClick={verifyRecipient} disabled={checkingRecipient}>
        {checkingRecipient ? "Checking..." : "Verify recipient"}
      </button>

      {recipientStatus?.exists && (
        <div className="wl-status-pill wl-status-pill--ok">Verified — ready to send</div>
      )}

      {recipientStatus && !recipientStatus.exists && (
        <div className="wl-status-card">
          <p>They haven't joined Wavelength yet. We'll hold this for 7 days and deliver it the moment they do.</p>
          <button className="wl-btn wl-btn-outline" onClick={() => setAllowPending(true)}>Send anyway</button>
        </div>
      )}

      <label className="wl-field-label">Message</label>
      <textarea
        className="wl-note"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Say what you can't say out loud."
      />
      <div className="wl-char-count wl-mono">{message.length} / 500</div>

      <label className="wl-field-label">Mood</label>
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

      <button type="button" className="wl-disclosure" onClick={() => setShowMore((v) => !v)}>
        <span>{showMore ? "Hide extra detail" : "Add a hint or context (optional)"}</span>
        <ChevronIcon open={showMore} />
      </button>
      {showMore && (
        <div className="wl-disclosure__body wl-fade-up">
          <label className="wl-field-label">Hint <span className="wl-field-label__optional">(optional)</span></label>
          <input
            type="text"
            className="wl-plain-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. Someone special"
          />
          <label className="wl-field-label">From <span className="wl-field-label__optional">(optional)</span></label>
          <textarea
            className="wl-plain-textarea"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="B3 Division"
          />
        </div>
      )}

      {recipientStatus && (
        <label className="wl-seal-row">
          <input type="checkbox" checked={publicConsent} onChange={(e) => setPublicConsent(e.target.checked)} />
          <span className="wl-seal-box">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M4 12l5 5L20 6" /></svg>
          </span>
          <span className="wl-seal-label">I'm okay with this confession being shared publicly if they also choose to share it.</span>
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

      <p className="wl-confess__footer-note">Someone on your campus might be thinking about you too.</p>

      <button type="button" className="wl-disclosure" onClick={() => setShowPreview((v) => !v)}>
        <span>{showPreview ? "Hide preview" : "Preview the postcard"}</span>
        <ChevronIcon open={showPreview} />
      </button>
      <div className={`wl-preview-panel ${showPreview ? "open" : ""}`}>
        <div className="preview-wrapper" id="previewWrapper" />
        <button className="wl-btn wl-btn-ghost wl-btn-block" onClick={downloadPages}>Save image</button>
      </div>

      <div
        className="template"
        id="template"
        style={{ display: "none", backgroundImage: `url(${MOODS.find((m) => m.id === mood).file})` }}
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