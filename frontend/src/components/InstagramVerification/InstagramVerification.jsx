import { useEffect, useRef, useState } from "react";

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

export default function InstagramVerification() {
  const [state, setState] = useState(
    VERIFICATION_STATES.IDLE
  );

  const [username, setUsername] = useState("");

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

  const pollingRef = useRef(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // =========================================
  // CLEANUP
  // =========================================

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

  // =========================================
  // EXISTING LOGIN CHECK
  // =========================================

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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

      // Already authenticated.
      window.location.replace("/");
    } catch (error) {
      console.error(
        "Existing login check failed:",
        error
      );
    }
  }

  // =========================================
  // GENERATE VERIFICATION CODE
  // =========================================

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

      // Try automatic clipboard copy.
      try {
        await navigator.clipboard.writeText(
          newCode
        );

        if (mountedRef.current) {
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

      // Immediately enter waiting state.
      setState(
        VERIFICATION_STATES.WAITING
      );

      // Start checking backend.
      startPolling(
        newSessionId
      );
    } catch (error) {
      console.error(
        "Generate verification error:",
        error
      );

      if (!mountedRef.current) {
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

  // =========================================
  // POLLING
  // =========================================

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

          // =================================
          // WRONG INSTAGRAM ACCOUNT
          // =================================

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

          // =================================
          // VERIFIED
          // =================================

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

          // =================================
          // STILL WAITING
          // =================================

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

    // =================================
    // SESSION TIMEOUT
    // =================================

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

  // =========================================
  // COMPLETE LOGIN
  // =========================================

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

    // Short success transition.
    timeoutRef.current =
      setTimeout(() => {
        window.location.replace(
          "/"
        );
      }, 1000);
  }

  // =========================================
  // COPY CODE
  // =========================================

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

  // =========================================
  // OPEN INSTAGRAM
  // =========================================

  function handleOpenInstagram() {
    setOpeningInstagram(true);

    /*
      IMPORTANT:

      We deliberately do not use an automatic
      countdown or automatically open Instagram.

      The user chooses this action.

      Use the HTTPS Instagram DM link first.
      The operating system/browser decides
      whether Instagram handles it.
    */

    const instagramUrl =
      `https://ig.me/m/${BUSINESS_USERNAME}`;

    window.open(
      instagramUrl,
      "_blank",
      "noopener,noreferrer"
    );

    // Return button to normal state.
    setTimeout(() => {
      if (
        mountedRef.current
      ) {
        setOpeningInstagram(false);
      }
    }, 800);
  }

  // =========================================
  // CLEAR POLLING
  // =========================================

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

  // =========================================
  // RETRY
  // =========================================

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

  // =========================================
  // SUCCESS
  // =========================================

  if (
    state ===
    VERIFICATION_STATES.VERIFIED
  ) {
    return (
      <div>
        <div>
          ✓
        </div>

        <h1>
          You're verified.
        </h1>

        <p>
          You're now known as
        </p>

        <h2>
          {anonymousName}
        </h2>

        <p>
          Welcome to
          ConfessionVault.
        </p>

        <p>
          Taking you home...
        </p>
      </div>
    );
  }

  // =========================================
  // MAIN FLOW
  // =========================================

  return (
    <div>
      <h1>
        Verify your Instagram
      </h1>

      <p>
        Verify your account to
        enter ConfessionVault
        anonymously.
      </p>

      {/* =========================
          USERNAME
          ========================= */}

      <label htmlFor="instagram-username">
        Instagram username
      </label>

      <input
        id="instagram-username"
        type="text"
        value={username}
        disabled={
          state !==
          VERIFICATION_STATES.IDLE &&
          state !==
          VERIFICATION_STATES.ERROR &&
          state !==
          VERIFICATION_STATES.EXPIRED
        }
        onChange={(event) => {
          setUsername(
            event.target.value
          );

          setError("");
        }}
        placeholder="your Instagram username"
        autoComplete="username"
      />

      {/* =========================
          INITIAL ACTION
          ========================= */}

      {(state ===
        VERIFICATION_STATES.IDLE ||
        state ===
          VERIFICATION_STATES.ERROR ||
        state ===
          VERIFICATION_STATES.EXPIRED) && (
        <button
          type="button"
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
            ? "Creating code..."
            : "Continue →"}
        </button>
      )}

      {/* =========================
          VERIFICATION CARD
          ========================= */}

      {code && (
        <div>
          <h2>
            Almost there 👋
          </h2>

          <p>
            Send this code to{" "}
            <strong>
              @{BUSINESS_USERNAME}
            </strong>{" "}
            on Instagram.
          </p>

          {/* CODE */}

          <div>
            <strong>
              {code}
            </strong>
          </div>

          {/* COPY */}

          <button
            type="button"
            onClick={
              handleCopy
            }
          >
            {copied
              ? "✓ Copied"
              : "Copy code"}
          </button>

          {/* INSTAGRAM */}

          <button
            type="button"
            disabled={
              openingInstagram
            }
            onClick={
              handleOpenInstagram
            }
          >
            {openingInstagram
              ? "Opening Instagram..."
              : "Open Instagram →"}
          </button>

          {/* STATUS */}

          {state ===
            VERIFICATION_STATES.WAITING && (
            <p>
              ◌ Waiting for your
              message...
            </p>
          )}

          {state ===
            VERIFICATION_STATES.VERIFYING && (
            <p>
              ◌ Verifying your
              Instagram...
            </p>
          )}
        </div>
      )}

      {/* =========================
          ERROR
          ========================= */}

      {error && (
        <div>
          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              handleRetry
            }
          >
            Try again
          </button>
        </div>
      )}

      {/* =========================
          PRIVACY
          ========================= */}

      <p>
        🔒 Your Instagram is only
        used for verification.
        Your identity stays
        anonymous on
        ConfessionVault.
      </p>
    </div>
  );
}