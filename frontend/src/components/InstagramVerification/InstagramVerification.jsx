//C:\Users\yashl\OneDrive\Desktop\clean-repo\frontend\src\components\InstagramVerification\InstagramVerification.jsx
import { useEffect, useRef, useState } from "react";
import "./InstagramVerification.css";
import "../../theme.css";

const API = import.meta.env.VITE_BACKEND_URL;

const BUSINESS_USERNAME = "wit_confessions.26";

const VERIFICATION_STATES = {
  IDLE: "idle",
  GENERATING: "generating",
  WAITING: "waiting",
  VERIFYING: "verifying",
  VERIFIED: "verified",
  ERROR: "error",
  EXPIRED: "expired",
};

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
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
      />
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
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="0.8"
        fill="currentColor"
        stroke="none"
      />
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

export default function InstagramVerification() {
  const [state, setState] = useState(
    VERIFICATION_STATES.IDLE
  );

  const [username, setUsername] =
    useState("");

  const [sessionId, setSessionId] =
    useState(null);

  const [code, setCode] =
    useState("");

  const [anonymousName, setAnonymousName] =
    useState("");

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [openingInstagram, setOpeningInstagram] =
    useState(false);

  const pollingRef =
    useRef(null);

  const timeoutRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      clearInterval(
        pollingRef.current
      );

      clearTimeout(
        timeoutRef.current
      );
    };
  }, []);

  useEffect(() => {
    checkExistingLogin();
  }, []);

  async function checkExistingLogin() {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const res = await fetch(
        `${API}/api/v1/auth/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        return;
      }

      const data =
        await res.json();

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.data.user
        )
      );

      window.location.replace("/");
    } catch (error) {
      console.error(
        "Existing login check failed:",
        error
      );
    }
  }

  async function handleGenerateCode() {
    const cleanUsername =
      username
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    if (!cleanUsername) {
      setError(
        "Please enter your Instagram username."
      );

      return;
    }

    clearPolling();

    setError("");
    setCopied(false);

    setState(
      VERIFICATION_STATES.GENERATING
    );

    try {
      const res = await fetch(
        `${API}/api/v1/auth/instagram/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username:
              cleanUsername,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Unable to create verification code."
        );
      }

      const newSessionId =
        data.data?.sessionId;

      const newCode =
        data.data?.code;

      if (
        !newSessionId ||
        !newCode
      ) {
        throw new Error(
          "Verification code could not be created."
        );
      }

      setUsername(
        cleanUsername
      );

      setSessionId(
        newSessionId
      );

      setCode(
        newCode
      );

      try {
        await navigator.clipboard.writeText(
          newCode
        );

        if (
          mountedRef.current
        ) {
          setCopied(true);

          setTimeout(() => {
            if (
              mountedRef.current
            ) {
              setCopied(false);
            }
          }, 1500);
        }
      } catch (clipboardError) {
        console.warn(
          "Automatic clipboard copy failed:",
          clipboardError
        );
      }

      setState(
        VERIFICATION_STATES.WAITING
      );

      startPolling(
        newSessionId
      );
    } catch (error) {
      console.error(
        "Generate verification error:",
        error
      );

      if (
        !mountedRef.current
      ) {
        return;
      }

      setError(
        error.message ||
          "Unable to start verification."
      );

      setState(
        VERIFICATION_STATES.ERROR
      );
    }
  }

  function startPolling(
    verificationSessionId
  ) {
    clearPolling();

    let checking = false;

    pollingRef.current =
      setInterval(async () => {
        if (checking) {
          return;
        }

        checking = true;

        try {
          const res =
            await fetch(
              `${API}/api/v1/auth/instagram/status/${verificationSessionId}`
            );

          const data =
            await res.json();

          if (!res.ok) {
            throw new Error(
              data.message ||
                "Verification failed."
            );
          }

          const status =
            data.data?.status;

          if (
            status ===
            "username_mismatch"
          ) {
            clearPolling();

            if (
              !mountedRef.current
            ) {
              return;
            }

            setError(
              data.data?.error ||
                "The code was sent from a different Instagram account."
            );

            setState(
              VERIFICATION_STATES.ERROR
            );

            return;
          }

          if (
            status ===
            "verified"
          ) {
            clearPolling();

            if (
              !mountedRef.current
            ) {
              return;
            }

            setState(
              VERIFICATION_STATES.VERIFYING
            );

            const token =
              data.data?.token;

            if (!token) {
              throw new Error(
                "Verification succeeded but login token was not received."
              );
            }

            await completeLogin(
              token
            );

            return;
          }

          if (
            status ===
            "pending"
          ) {
            if (
              mountedRef.current
            ) {
              setState(
                VERIFICATION_STATES.WAITING
              );
            }

            return;
          }
        } catch (error) {
          console.error(
            "Verification polling error:",
            error
          );

          clearPolling();

          if (
            mountedRef.current
          ) {
            setError(
              "We couldn't check your verification. Please try again."
            );

            setState(
              VERIFICATION_STATES.ERROR
            );
          }
        } finally {
          checking = false;
        }
      }, 2000);

    timeoutRef.current =
      setTimeout(() => {
        clearPolling();

        if (
          mountedRef.current
        ) {
          setError(
            "This verification code has expired."
          );

          setState(
            VERIFICATION_STATES.EXPIRED
          );
        }
      }, 5 * 60 * 1000);
  }

  async function completeLogin(
    token
  ) {
    localStorage.setItem(
      "token",
      token
    );

    const res =
      await fetch(
        `${API}/api/v1/auth/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    const data =
      await res.json();

    if (!res.ok) {
      localStorage.removeItem(
        "token"
      );

      throw new Error(
        "Unable to load your account."
      );
    }

    localStorage.setItem(
      "user",
      JSON.stringify(
        data.data.user
      )
    );

    const profile =
      data.data.anonymousProfile;

    if (
      !profile?.anonymousName
    ) {
      throw new Error(
        "Anonymous identity could not be loaded."
      );
    }

    if (
      !mountedRef.current
    ) {
      return;
    }

    setAnonymousName(
      profile.anonymousName
    );

    setState(
      VERIFICATION_STATES.VERIFIED
    );

    timeoutRef.current =
      setTimeout(() => {
        window.location.replace("/");
      }, 1100);
  }

  async function handleCopy() {
    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopied(true);

      setTimeout(() => {
        if (
          mountedRef.current
        ) {
          setCopied(false);
        }
      }, 1500);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  }

  function handleOpenInstagram() {
    setOpeningInstagram(true);

    const instagramUrl =
      `https://ig.me/m/${BUSINESS_USERNAME}`;

    window.open(
      instagramUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setTimeout(() => {
      if (
        mountedRef.current
      ) {
        setOpeningInstagram(false);
      }
    }, 500);
  }

  function clearPolling() {
    clearInterval(
      pollingRef.current
    );

    clearTimeout(
      timeoutRef.current
    );

    pollingRef.current =
      null;

    timeoutRef.current =
      null;
  }

  function handleRetry() {
    clearPolling();

    setError("");
    setCode("");
    setSessionId(null);
    setCopied(false);
    setOpeningInstagram(false);

    setState(
      VERIFICATION_STATES.IDLE
    );
  }

  // =====================================================
  // SUCCESS
  // =====================================================

  if (
    state ===
    VERIFICATION_STATES.VERIFIED
  ) {
    return (
      <main className="cv-instagram-auth">
        <section className="cv-instagram-auth__success">
          <div className="cv-instagram-auth__success-icon">
            <CheckIcon />
          </div>

          <h1>
            You're verified.
          </h1>

          <p className="cv-instagram-auth__success-label">
            You're now known as
          </p>

          <h2 className="cv-instagram-auth__anonymous-name">
            {anonymousName}
          </h2>

          <p className="cv-instagram-auth__success-message">
            Welcome to ConfessionVault.
          </p>

          <p className="cv-instagram-auth__success-loading">
            Taking you home...
          </p>
        </section>
      </main>
    );
  }

  const verificationActive =
    Boolean(code);

  const canEditUsername =
    state ===
      VERIFICATION_STATES.IDLE ||
    state ===
      VERIFICATION_STATES.ERROR ||
    state ===
      VERIFICATION_STATES.EXPIRED;

  return (
    <main className="cv-instagram-auth">
      <div className="cv-instagram-auth__container">

        {/* =========================================
            BRAND
            ========================================= */}

        <header className="cv-instagram-auth__brand">
          <div className="cv-instagram-auth__brand-mark">
            <ShieldIcon />
          </div>

          <p className="cv-instagram-auth__brand-name">
            ConfessionVault
          </p>

          <p className="cv-instagram-auth__brand-subtitle">
            Private by design
          </p>
        </header>

        {/* =========================================
            HEADING
            ========================================= */}

        <h1 className="cv-instagram-auth__heading">
          Verify your Instagram
        </h1>

        <p className="cv-instagram-auth__description">
          Verify your account to enter
          ConfessionVault anonymously.
        </p>

        {/* =========================================
            MAIN CARD
            ========================================= */}

        <section className="cv-instagram-auth__card">

          {/* =======================================
              USERNAME
              ======================================= */}

          <label
            htmlFor="instagram-username"
            className="cv-instagram-auth__field-label"
          >
            Instagram username
          </label>

          <div className="cv-instagram-auth__input-wrap">

            <span className="cv-instagram-auth__input-prefix">
              @
            </span>

            <input
              id="instagram-username"
              className={`cv-instagram-auth__input ${
                !canEditUsername
                  ? "cv-instagram-auth__input--locked"
                  : ""
              }`}
              type="text"
              value={username}
              disabled={!canEditUsername}
              onChange={(event) => {
                setUsername(
                  event.target.value
                );

                setError("");
              }}
              placeholder="your Instagram username"
              autoComplete="username"
            />

            {!canEditUsername && (
              <span className="cv-instagram-auth__lock">
                <LockIcon />
              </span>
            )}
          </div>

          {/* =======================================
              CONTINUE
              ======================================= */}

          {!verificationActive && (
            <button
              type="button"
              className="cv-instagram-auth__primary"
              disabled={
                state ===
                VERIFICATION_STATES.GENERATING
              }
              onClick={
                handleGenerateCode
              }
            >
              {state ===
              VERIFICATION_STATES.GENERATING
                ? "Creating your code..."
                : "Continue →"}
            </button>
          )}

          {/* =======================================
              PRIVACY
              ======================================= */}

          {!verificationActive && (
            <div className="cv-instagram-auth__privacy">
              <span className="cv-instagram-auth__privacy-icon">
                <ShieldIcon />
              </span>

              <span>
                Your Instagram is only used
                to verify your account.
                Your identity stays anonymous
                on ConfessionVault.
              </span>
            </div>
          )}

          {/* =======================================
              VERIFICATION CARD
              ======================================= */}

          {verificationActive && (
            <section
              className="cv-instagram-auth__verification"
              aria-live="polite"
            >
              <h2 className="cv-instagram-auth__verification-title">
                Almost there 👋
              </h2>

              <p className="cv-instagram-auth__verification-text">
                Send this code from{" "}
                <strong>
                  @{username}
                </strong>{" "}
                to{" "}
                <span className="cv-instagram-auth__destination">
                  @{BUSINESS_USERNAME}
                </span>{" "}
                on Instagram.
              </p>

              {/* CODE */}

              <div
                className="cv-instagram-auth__code"
                aria-label={`Verification code ${code}`}
              >
                {code}
              </div>

              {/* ACTIONS */}

              <div className="cv-instagram-auth__actions">

                <button
                  type="button"
                  className="cv-instagram-auth__secondary"
                  onClick={
                    handleCopy
                  }
                >
                  {copied
                    ? "✓ Copied"
                    : "Copy code"}
                </button>

                <button
                  type="button"
                  className="cv-instagram-auth__instagram"
                  disabled={
                    openingInstagram
                  }
                  onClick={
                    handleOpenInstagram
                  }
                >
                  <InstagramIcon />

                  {openingInstagram
                    ? "Opening Instagram..."
                    : "Open Instagram →"}
                </button>

              </div>

              {/* STATUS */}

              {state ===
                VERIFICATION_STATES.WAITING && (
                <div className="cv-instagram-auth__status">
                  <span className="cv-instagram-auth__status-dot" />

                  <span>
                    Waiting for your message...
                  </span>
                </div>
              )}

              {state ===
                VERIFICATION_STATES.VERIFYING && (
                <div className="cv-instagram-auth__status">
                  <span className="cv-instagram-auth__status-dot" />

                  <span>
                    Verifying your Instagram...
                  </span>
                </div>
              )}

              {state ===
                VERIFICATION_STATES.ERROR && (
                <div className="cv-instagram-auth__error">
                  {error}
                </div>
              )}

              {state ===
                VERIFICATION_STATES.EXPIRED && (
                <div className="cv-instagram-auth__error">
                  {error}
                </div>
              )}

              {(state ===
                VERIFICATION_STATES.ERROR ||
                state ===
                  VERIFICATION_STATES.EXPIRED) && (
                <button
                  type="button"
                  className="cv-instagram-auth__retry"
                  onClick={
                    handleRetry
                  }
                >
                  Generate new code
                </button>
              )}

            </section>
          )}

        </section>
      </div>
    </main>
  );
}