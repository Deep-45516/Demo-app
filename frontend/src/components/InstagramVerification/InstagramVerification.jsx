//C:\Users\yashl\OneDrive\Desktop\clean-repo\frontend\src\components\InstagramVerification\InstagramVerification.jsx
import { useEffect, useRef, useState } from "react";
import "./InstagramVerification.css";
import "../../wavelength.css";

const API = import.meta.env.VITE_BACKEND_URL;

const BUSINESS_USERNAME = "wit_confessions.26";
const SHAYARI_DELAY = 1500;

const LOADING_LINES = [

"Setting things up…",
  "Locking your identity 🔒",
  "Collecting confessions you got… if any 👀",
  "Someone might've written about you",
  "Almost there… don't blink 👀",

  // `Wait for few seconds
  //  Getting there...`,
  //   `ज़िंदगी चलती रही, वक़्त भी चलता रहा,
  // बस दिल था कि वहीं ठहरा रहा`,

  //   `वक़्त के साथ हर रंग बदल जाता है,
  // कल का अपना, याद बन जाता है|
  // दिमाग़ तो छोड़ ही दे उसे,
  // मगर दिल है कि उसकी Story आते ही ठहर जाता है। `,

  //   `जब ख़ामोश आँखों से बात होती है,
  // ऐसे ही किसी कहानी की शुरुआत होती है,
  // तुम्हारी ही बातों में खोए रहते हैं,
  // पता नहीं कब नींद से मुलाक़ात होती है`,

  //   `दिल अभी पूरी तरह टूटा नहीं,
  // दोस्तों की मेहरबानी चाहिए।`,
];

const COUNT_KEY = "confessionCount";
const COUNT_TTL = 10 * 60 * 1000; // 10 minutes

const VERIFICATION_STATES = {
  IDLE: "idle",
  GENERATING: "generating",
  WAITING: "waiting",
  VERIFYING: "verifying",
  VERIFIED: "verified",
  ERROR: "error",
  EXPIRED: "expired",
};

function SignalMarkIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="9" width="11" height="9" rx="1.5" />
      <path d="M16 11.5h1.5a2 2 0 0 1 0 4H16" />
      <path d="M9 3.5c0 1-1 1-1 2s1 1 1 2" />
      <path d="M12.5 3.5c0 1-1 1-1 2s1 1 1 2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
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

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const duration = 900;
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString("en-IN")}</>;
}


export default function InstagramVerification({
  backendReady,
  healthcheckStartedAt,
}) {
  const [startupState, setStartupState] = useState("checking");

// const [lineIndex, setLineIndex] = useState(() =>
//     Math.floor(Math.random() * LOADING_LINES.length),
//   );
  const [elapsed, setElapsed] = useState(0);
  const [totalConfessions, setTotalConfessions] = useState(() => {
    const saved = Number(localStorage.getItem(COUNT_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : null;
  });
  const [state, setState] = useState(VERIFICATION_STATES.IDLE);
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [code, setCode] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openingInstagram, setOpeningInstagram] = useState(false);

  const pollingRef = useRef(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Server responded before the threshold.
    // Don't show Shayari.
    if (backendReady) {
      setStartupState("ready");
      return;
    }

    const elapsed = performance.now() - healthcheckStartedAt;

    const remaining = Math.max(0, SHAYARI_DELAY - elapsed);

    const timer = setTimeout(() => {
      if (!backendReady) {
        setStartupState("shayari");
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [backendReady, healthcheckStartedAt]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(pollingRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    checkExistingLogin();
  }, []);

  async function checkExistingLogin() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data.data.user));
      window.location.replace("/");
    } catch (error) {
      console.error("Existing login check failed:", error);
    }
  }

    // Fetch the real count once the server is awake, and remember it
    // Fetch the real count (only when needed) and remember it
  useEffect(() => {
    if (!backendReady) return;

    // Logged-in users get redirected, so they never see the count
    if (localStorage.getItem("token")) return;

    // Saved number is still fresh, so no call
    const fetchedAt = Number(localStorage.getItem("confessionCountAt")) || 0;
    if (
      Date.now() - fetchedAt < COUNT_TTL &&
      localStorage.getItem(COUNT_KEY)
    ) {
      return;
    }

    fetch(`${API}/api/v1/confessions/public-count`)
      .then((r) => r.json())
      .then((d) => {
        const n = d?.data?.total;
        if (typeof n === "number") {
          setTotalConfessions(n);
          localStorage.setItem(COUNT_KEY, String(n));
          localStorage.setItem("confessionCountAt", String(Date.now()));
        }
      })
      .catch(() => {});
  }, [backendReady]);

  // useEffect(() => {
  //   if (startupState !== "shayari") return;

  //   const lineTimer = setInterval(
  //     () => setLineIndex((i) => (i + 1) % LOADING_LINES.length),
  //     3200,
  //   );

  //   const start = performance.now();
  //   const barTimer = setInterval(() => {
  //     const t = (performance.now() - start) / 1000;
  //     setProgress(Math.min(92, 92 * (1 - Math.exp(-t / 14))));
  //   }, 250);

  //   return () => {
  //     clearInterval(lineTimer);
  //     clearInterval(barTimer);
  //   };
  // }, [startupState]);
    // Seconds since the waiting screen appeared
  useEffect(() => {
    if (startupState !== "shayari") return;

    const start = performance.now();
    const timer = setInterval(() => {
      setElapsed((performance.now() - start) / 1000);
    }, 250);

    return () => clearInterval(timer);
  }, [startupState]);

  async function handleGenerateCode() {
    const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();

    if (!cleanUsername) {
      setError("Please enter your Instagram username.");
      return;
    }

    clearPolling();
    setError("");
    setCopied(false);
    setState(VERIFICATION_STATES.GENERATING);

    try {
      const res = await fetch(`${API}/api/v1/auth/instagram/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to create verification code.");
      }

      const newSessionId = data.data?.sessionId;
      const newCode = data.data?.code;

      if (!newSessionId || !newCode) {
        throw new Error("Verification code could not be created.");
      }

      setUsername(cleanUsername);
      setSessionId(newSessionId);
      setCode(newCode);

      try {
        await navigator.clipboard.writeText(newCode);
        if (mountedRef.current) {
          setCopied(true);
          setTimeout(() => {
            if (mountedRef.current) setCopied(false);
          }, 1500);
        }
      } catch (clipboardError) {
        console.warn("Automatic clipboard copy failed:", clipboardError);
      }

      setState(VERIFICATION_STATES.WAITING);
      startPolling(newSessionId);
    } catch (error) {
      console.error("Generate verification error:", error);
      if (!mountedRef.current) return;
      setError(error.message || "Unable to start verification.");
      setState(VERIFICATION_STATES.ERROR);
    }
  }

  function startPolling(verificationSessionId) {
    clearPolling();
    let checking = false;

    pollingRef.current = setInterval(async () => {
      if (checking) return;
      checking = true;

      try {
        const res = await fetch(
          `${API}/api/v1/auth/instagram/status/${verificationSessionId}`,
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Verification failed.");
        }

        const status = data.data?.status;

        if (status === "username_mismatch") {
          clearPolling();
          if (!mountedRef.current) return;
          setError(
            data.data?.error ||
              "The code was sent from a different Instagram account.",
          );
          setState(VERIFICATION_STATES.ERROR);
          return;
        }

        if (status === "verified") {
          clearPolling();
          if (!mountedRef.current) return;
          setState(VERIFICATION_STATES.VERIFYING);
          const token = data.data?.token;
          if (!token)
            throw new Error(
              "Verification succeeded but login token was not received.",
            );
          await completeLogin(token);
          return;
        }

        if (status === "pending") {
          if (mountedRef.current) setState(VERIFICATION_STATES.WAITING);
          return;
        }
      } catch (error) {
        console.error("Temporary verification polling error:", error);

        /*
         * IMPORTANT:
         *
         * A polling request can fail temporarily because of:
         *
         * - Render waking up
         * - temporary network issue
         * - mobile browser connection change
         * - request timeout
         *
         * Do NOT immediately destroy the verification process.
         *
         * The next polling interval will try again.
         */
      } finally {
        checking = false;
      }
    }, 2000);

    timeoutRef.current = setTimeout(
      () => {
        clearPolling();
        if (mountedRef.current) {
          setError("This verification code has expired.");
          setState(VERIFICATION_STATES.EXPIRED);
        }
      },
      5 * 60 * 1000,
    );
  }

  async function completeLogin(token) {
    localStorage.setItem("token", token);

    const res = await fetch(`${API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      localStorage.removeItem("token");
      throw new Error("Unable to load your account.");
    }

    localStorage.setItem("user", JSON.stringify(data.data.user));

    const profile = data.data.anonymousProfile;
    if (!profile?.anonymousName) {
      throw new Error("Anonymous identity could not be loaded.");
    }

    localStorage.setItem("anonymousProfile", JSON.stringify(profile));

    if (!mountedRef.current) return;

    setAnonymousName(profile.anonymousName);
    setState(VERIFICATION_STATES.VERIFIED);

    timeoutRef.current = setTimeout(() => {
      window.location.replace("/");
    }, 3100);
  }

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => {
        if (mountedRef.current) setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  function handleOpenInstagram() {
    setOpeningInstagram(true);
    const instagramUrl = `https://ig.me/m/${BUSINESS_USERNAME}`;
    window.open(instagramUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      if (mountedRef.current) setOpeningInstagram(false);
    }, 500);
  }

  function clearPolling() {
    clearInterval(pollingRef.current);
    clearTimeout(timeoutRef.current);
    pollingRef.current = null;
    timeoutRef.current = null;
  }

  function handleRetry() {
    clearPolling();
    setError("");
    setCode("");
    setSessionId(null);
    setCopied(false);
    setOpeningInstagram(false);
    setState(VERIFICATION_STATES.IDLE);
  }

  // =====================================================
  // SUCCESS
  // =====================================================
  if (state === VERIFICATION_STATES.VERIFIED) {
    return (
      <main className="wl-instagram-auth">
        <section className="wl-instagram-auth__success wl-fade-up">
          <div className="wl-instagram-auth__success-icon">
            <CheckIcon />
          </div>
          <p className="wl-instagram-auth__success-label wl-mono">
            Your Secret Name is
          </p>
          <h2 className="wl-instagram-auth__anonymous-name wl-display">
            {anonymousName}
          </h2>
        </section>
      </main>
    );
  }

  const verificationActive = Boolean(code);
  const canEditUsername =
    state === VERIFICATION_STATES.IDLE ||
    state === VERIFICATION_STATES.ERROR ||
    state === VERIFICATION_STATES.EXPIRED;

  const stepLevel = verificationActive ? 2 : 1;

  if (startupState === "checking") {
    return (
      <main className="wl-instagram-auth wl-startup-shell">
        <div className="wl-startup-shell__mark">
          <SignalMarkIcon />
        </div>
      </main>
    );
  }
    const stageIndex = Math.min(
    LOADING_STAGES.length - 1,
    Math.floor(elapsed / 3.5),
  );
  // Always creeps forward, never reaches 100%
  const progress = 94 * (1 - 1 / (1 + elapsed / 12));

   if (startupState === "shayari") {
    return (
      <main className="wl-instagram-auth wl-shayari-screen">
        <div className="wl-shayari-screen__glow" />

        <section className="wl-loading">
          <div className="wl-loading__mark">
            <span className="wl-loading__ring" />
            <span className="wl-loading__ring wl-loading__ring--2" />
            <SignalMarkIcon />
          </div>

          <p className="wl-loading__eyebrow wl-mono">🔥 NOW LIVE AT WIT</p>

          <h2 className="wl-loading__headline wl-display">
            Who's saying what about you? 👀
          </h2>

          <ul className="wl-loading__steps">
            {LOADING_STAGES.map((label, i) => (
              <li
                key={label}
                className={
                  i < stageIndex ? "is-done" : i === stageIndex ? "is-active" : ""
                }
              >
                <span className="wl-loading__tick">
                  {i < stageIndex ? "✓" : ""}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="wl-loading__bar" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <p className="wl-loading__hint wl-mono">
            First open takes a few extra seconds
          </p>

          {totalConfessions !== null && (
            <p className="wl-loading__count wl-mono">
              💌 {totalConfessions.toLocaleString("en-IN")} confessions sent so far
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="wl-instagram-auth">
      <div className="wl-instagram-auth__container">
<header className="wl-instagram-auth__brand">
  <div className="wl-instagram-auth__brand-name-wrap">
    <p className="wl-instagram-auth__brand-name">
      TBH
    </p>

    <svg
      className="wl-instagram-auth__brand-underline"
      viewBox="0 0 120 18"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M4 11 C28 5, 52 5, 76 8 C91 10, 103 9, 116 6"
      />
    </svg>
  </div>

  <p className="wl-instagram-auth__brand-tagline">
    No Walls. No Cap.
  </p>

    {!verificationActive && totalConfessions !== null && (
    <p className="wl-instagram-auth__count wl-mono">
      💌 <AnimatedNumber value={totalConfessions} /> confessions sent yet
    </p>
  )}
</header>

        {/* <div
          className="wl-eyebrow"
          style={{ justifyContent: "center", marginBottom: 12 }}
        >
          <div className="wl-sbars" data-level={stepLevel}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          {verificationActive ? "STEP 2" : "STEP 1"}
        </div> */}

        <h1 className="wl-instagram-auth__heading wl-display">
          {verificationActive ? (
            <>
              Send this code to{" "}
              <span className="wl-instagram-auth__destination">
                @{BUSINESS_USERNAME}
              </span>
            </>
          ) : (
            "Find your Secret name"
          )}
        </h1>

        {/* <p className="wl-instagram-auth__description">
          {verificationActive
  ? ""
  : ""}
        </p> */}

        <section className="wl-instagram-auth__card wl-card">
          <label
            htmlFor="instagram-username"
            className="wl-instagram-auth__field-label"
            aria-hidden={true}
          >
            {verificationActive ? "" : "Instagram username"}
          </label>

          <div className="wl-instagram-auth__input-wrap">
            <span className="wl-instagram-auth__input-prefix">@</span>
            <input
              id="instagram-username"
              className={`wl-instagram-auth__input ${!canEditUsername ? "wl-instagram-auth__input--locked" : ""}`}
              type="text"
              value={username}
              disabled={!canEditUsername}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              placeholder="your Instagram username"
              autoComplete="username"
            />
            {!canEditUsername && (
              <span className="wl-instagram-auth__lock">
                <LockIcon />
              </span>
            )}
          </div>

          {!verificationActive && (
            <button
              type="button"
              className="wl-btn wl-btn-primary wl-btn-block wl-instagram-auth__primary"
              disabled={state === VERIFICATION_STATES.GENERATING}
              onClick={handleGenerateCode}
            >
              {state === VERIFICATION_STATES.GENERATING ? (
                "Creating your code..."
              ) : (
                <>
                  Continue <ArrowIcon />
                </>
              )}
            </button>
          )}

          {!verificationActive && (
            <div className="wl-instagram-auth__privacy">
              <span className="wl-instagram-auth__privacy-icon">
                <ShieldIcon />
              </span>
              <span>Private & anonymous.</span>
            </div>
          )}

          {verificationActive && (
            <section
              className="wl-instagram-auth__verification wl-fade-up"
              aria-live="polite"
            >
              <p className="wl-instagram-auth__verification-text">
                DM it from <strong>@{username}</strong>
                {/* to{" "}
                <span className="wl-instagram-auth__destination">
                  @{BUSINESS_USERNAME}
                </span> */}
              </p>

              {/* Instagram reference image */}
              <div className="wl-instagram-auth__reference">
                <img
                  src="/wyt-confessions(1).png"
                  alt="How to send the verification code on Instagram"
                />
              </div>

              {/* Verification code */}
              <div className="wl-instagram-auth__code-label wl-mono">
                YOUR CODE
              </div>

              <button
                type="button"
                className="wl-instagram-auth__code wl-mono"
                onClick={handleCopy}
                aria-label="Copy verification code"
              >
                <span>{code}</span>

                <span
                  className="wl-instagram-auth__copy-icon"
                  aria-hidden="true"
                >
                  {copied ? "✓" : "⧉"}
                </span>
              </button>

              {/* Instagram button */}
              <div className="wl-instagram-auth__actions">
                <button
                  type="button"
                  className="wl-btn wl-instagram-auth__instagram"
                  disabled={openingInstagram}
                  onClick={handleOpenInstagram}
                >
                  <InstagramIcon />
                  {openingInstagram ? "Opening..." : "Open Instagram"}
                </button>
              </div>

              {/* Verification status */}
              {state === VERIFICATION_STATES.WAITING && (
                <div className="wl-instagram-auth__status">
                  <div className="wl-eq">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <span className="wl-mono">Waiting for verification</span>
                </div>
              )}

              {state === VERIFICATION_STATES.VERIFYING && (
                <div className="wl-instagram-auth__status">
                  <div className="wl-eq">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <span className="wl-mono">Verifying</span>
                </div>
              )}

              {(state === VERIFICATION_STATES.ERROR ||
                state === VERIFICATION_STATES.EXPIRED) && (
                <>
                  <div className="wl-instagram-auth__error">{error}</div>

                  <button
                    type="button"
                    className="wl-btn wl-btn-outline wl-btn-block wl-instagram-auth__retry"
                    onClick={handleRetry}
                  >
                    Generate new code
                  </button>
                </>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
