import { useEffect, useRef, useState } from "react";

import VerificationForm from "./VerificationForm";
import VerificationInstructions from "./VerificationInstructions";
import VerificationWaiting from "./VerificationWaiting";
import VerificationError from "./VerificationError";
import VerificationSuccess from "./VerificationSuccess";
//useRef is used to store mutable values that do not cause a re-render when updated, it save values that we want to use later.
// setInterval() runs the same code again and again after a fixed time.
// Here, it checks the verification status every 2 seconds.
// setTimeout() runs the code only once after a fixed time.
// Here, it stops the verification process after 5 minutes.
// We store their IDs in useRef so we can stop them later using clearInterval() and clearTimeout().
const API = import.meta.env.VITE_BACKEND_URL;
const BUSINESS_USERNAME = "wit_confessions.26";

export default function InstagramVerification() {
  const [step, setStep] = useState("form");

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(null);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);


  useEffect(() => {
  const checkExistingLogin = async () => {
    const token = localStorage.getItem("token");

    // No token in this browser.
    // Continue with normal Instagram verification.
    if (!token) {
      return;
    }

    try {
      const res = await fetch(
        `${API}/api/v1/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Token is invalid or expired.
      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      const data = await res.json();

      // This token belongs to the user already
      // authenticated in THIS browser.
      localStorage.setItem(
        "user",
        JSON.stringify(data.data.user)
      );

      // Already logged in.
      window.location.replace("/");
    } catch (error) {
      console.error(
        "Existing login check failed:",
        error
      );
    }
  };

  checkExistingLogin();
}, []);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

const openInstagram = () => {
  // Try opening the Instagram app.
  window.location.href =
    `instagram://user?username=${BUSINESS_USERNAME}`;

  // Fallback to Instagram web.
  setTimeout(() => {
    window.open(
      `https://ig.me/m/${BUSINESS_USERNAME}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, 1200);
};

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = (sessionId) => {
  setStep("waiting");

  // Prevent duplicate polling intervals.
  clearInterval(intervalRef.current);
  clearTimeout(timeoutRef.current);

  let checking = false;

  intervalRef.current = setInterval(async () => {
    // Prevent another request from starting
    // if the previous request has not finished yet.
    if (checking) {
      return;
    }

    checking = true;

    try {
      const res = await fetch(
        `${API}/api/v1/auth/instagram/status/${sessionId}`,
      );

      const data = await res.json();

      console.log(
        "Instagram verification status:",
        data.data?.status,
      );

      if (!res.ok) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);

        setError(
          data.message ||
            "Verification failed.",
        );

        setStep("error");
        return;
      }

      // =========================
      // USERNAME MISMATCH
      // =========================

      if (
        data.data?.status ===
        "username_mismatch"
      ) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);

        setError(
          data.data.error ||
            "The verification code was sent from a different Instagram account.",
        );

        setStep("error");
        return;
      }

      // =========================
      // VERIFIED
      // =========================

      if (
        data.data?.status ===
        "verified"
      ) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);

        const token =
          data.data.token;

        if (!token) {
          setError(
            "Verification succeeded, but login token was not received.",
          );

          setStep("error");
          return;
        }

        // Save JWT immediately.
        localStorage.setItem(
          "token",
          token,
        );

        // Get the complete current user
        // from the backend.
        const meRes =
          await fetch(
            `${API}/api/v1/auth/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const meData =
          await meRes.json();

        if (!meRes.ok) {
          localStorage.removeItem(
            "token",
          );

          setError(
            "Unable to load user.",
          );

          setStep("error");
          return;
        }

        // Save user information.
        localStorage.setItem(
          "user",
          JSON.stringify(
            meData.data.user,
          ),
        );

        // Keep anonymous profile available
        // for the current UI.
        if (
          meData.data.anonymousProfile
        ) {
setAnonymousName(
  meData.data
    .anonymousProfile
    .anonymousName,
);
}

// Verification is complete.
// Show the anonymous identity first.
// The user will continue to the main page
// from the success screen.
setStep("verified");
return;
      }

      // =========================
      // STILL WAITING
      // =========================

      // No action required.
      // The next interval will check again.

    } catch (err) {
      console.error(
        "Instagram polling error:",
        err,
      );

      clearInterval(
        intervalRef.current,
      );

      clearTimeout(
        timeoutRef.current,
      );

      setError(
        "Unable to contact the server. Please try again.",
      );

      setStep("error");
    } finally {
      checking = false;
    }
  }, 2000);

  // Stop checking after 5 minutes.
  timeoutRef.current =
    setTimeout(() => {
      clearInterval(
        intervalRef.current,
      );

      setError(
        "Verification expired. Please generate a new verification code.",
      );

      setStep("error");
    }, 5 * 60 * 1000);
};

  const verify = async () => {
    if (!username.trim()) {
      alert("Please enter your Instagram username.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/v1/auth/instagram/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      });
      //convert json to js object
      /*{
  statusCode: 201,
  data: {
    sessionId: "...",
    code: "CV-8D4DE2B2"
  },
  message: "Verification session created"
} */
      const data = await res.json();
      //check status code is 201 or not
      if (!res.ok) {
        alert(data.message || "Verification failed.");
        return;
      }
//       // ⭐ EXISTING USER
// if (data.data?.alreadyVerified) {
//   localStorage.setItem("token", data.data.token);

//   const meRes = await fetch(`${API}/api/v1/auth/me`, {
//     headers: {
//       Authorization: `Bearer ${data.data.token}`,
//     },
//   });
//   console.log("START RESPONSE:", data);
// console.log("alreadyVerified:", data.data?.alreadyVerified);

//   const meData = await meRes.json();

//   localStorage.setItem("user", JSON.stringify(meData.data.user));

//   window.location.replace("/");
//   return;   // <-- THIS IS CRITICAL
// }

      //this is js destructuring,instead of const sessionId = data.data.sessionId; const code = data.data.code;
      const { sessionId, code } = data.data;

      setSessionId(sessionId);
      setCode(code);
      // Copy verification code
      try {
        await navigator.clipboard.writeText(code);
      } catch (err) {
        console.error(err);
      }
      //open DM
      // openInstagram();

setStep("instructions");
setCountdown(5);

// Start polling immediately.
// We do NOT wait for Instagram to open.
//
// This is important because the Instagram app /
// instagram:// link may move the browser into the
// background.
startPolling(sessionId);

countdownRef.current =
  setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(
          countdownRef.current,
        );

        return 0;
      }

      return prev - 1;
    });
  }, 1000);

// Give React time to render the
// instructions before opening Instagram.
setTimeout(() => {
  openInstagram();
}, 5000);
    } catch (err) {
      console.error(err);

      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      {step === "form" && (
        <VerificationForm
          username={username}
          setUsername={setUsername}
          loading={loading}
          onVerify={verify}
        />
      )}

      {step === "instructions" && (
        <VerificationInstructions
          username={username}
          code={code}
          onCopy={copyCode}
          onOpenInstagram={openInstagram}
          countdown={countdown}
          // onSent={startPolling}
        />
      )}

      {step === "waiting" && <VerificationWaiting />}

      {step === "error" && (
        <VerificationError
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {step === "verified" && (
        <VerificationSuccess
          anonymousName={anonymousName}
          onContinue={() => window.location.replace("/")}
        />
      )}
    </div>
  );
}
