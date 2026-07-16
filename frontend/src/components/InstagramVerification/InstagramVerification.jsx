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

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const openInstagram = () => {
    window.open(
      `https://ig.me/m/${BUSINESS_USERNAME}`,
      "_blank"
    );
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = () => {
    setStep("waiting");

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${API}/api/v1/auth/instagram/status/${sessionId}`
        );

        const data = await res.json();

        if (!res.ok) {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);

          setError(data.message || "Verification failed.");
          setStep("error");
          return;
        }

        if (data.data.status === "username_mismatch") {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);

          setError(data.data.error);
          setStep("error");
          return;
        }

        if (data.data.status === "verified") {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);

          localStorage.setItem(
            "token",
            data.data.token
          );

          const meRes = await fetch(
            `${API}/api/v1/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${data.data.token}`,
              },
            }
          );

          const meData = await meRes.json();

          setAnonymousName(
            meData.data.anonymousProfile.anonymousName
          );

          setStep("verified");
        }
      } catch (err) {
        console.error(err);

        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);

        setError(
          "Unable to contact the server. Please try again."
        );

        setStep("error");
      }
    }, 2000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);

      setError(
        "Verification expired. Please generate a new verification code."
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
      const res = await fetch(
        `${API}/api/v1/auth/instagram/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
          }),
        }
      );
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
//this is js destructuring,instead of const sessionId = data.data.sessionId; const code = data.data.code;
      const {
        sessionId,
        code,
      } = data.data;

      setSessionId(sessionId);
      setCode(code);
// Copy verification code
      try {
        await navigator.clipboard.writeText(code);
      } catch (err) {
        console.error(err);
      }
//open DM
      openInstagram();

      setStep("instructions");
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
          onSent={startPolling}
        />
      )}

      {step === "waiting" && (
        <VerificationWaiting />
      )}

      {step === "error" && (
        <VerificationError
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {step === "verified" && (
        <VerificationSuccess
          anonymousName={anonymousName}
          onContinue={() =>
            window.location.replace("/")
          }
        />
      )}
    </div>
  );
}