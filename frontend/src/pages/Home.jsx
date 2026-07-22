import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";

import { generatePages } from "../pageGenerator.js";
import { submitConfession } from "../submit.js";
import { downloadPages } from "../download.js";
import { searchRecipient } from "../searchRecipient.js";

const API = import.meta.env.VITE_BACKEND_URL;

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [recipientStatus, setRecipientStatus] = useState(null);
  const [allowPending, setAllowPending] = useState(false);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  //Has this browser already logged into ConfessionVault?
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  //useeffect trigged when to, from, or message changes. It generates the pages for preview.
  useEffect(() => {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        generatePages(to, from, message);
      });
    });
  }, [to, from, message]);

  const verifyRecipient = async () => {
    if (!to.trim()) {
      alert("Enter recipient username.");
      return;
    }

    try {
      setCheckingRecipient(true);

      const result = await searchRecipient(to);

      setRecipientStatus(result.data);

      setAllowPending(false);
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingRecipient(false);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="container">
        <div className="form">
          <h2>Login to submit confession</h2>
          {/*
Google doesn't directly give us the user's name/email.
It gives a digitally signed identity token called a "credential".

We can't trust it on the frontend, so we send the credential
to the backend (/api/v1/auth/google). The backend verifies
the token with Google, and if it's valid, returns our own JWT
and the user's information.
*/}
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
                localStorage.setItem("user", JSON.stringify(data.data.user));

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
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form">
        <p>Logged in as {user.email}</p>

        <button onClick={logoutUser}>Logout</button>

        <label>Recipient Username</label>

<input
  type="text"
  value={to}
  onChange={(e) => {
    setTo(e.target.value);
    setRecipientStatus(null);
    setAllowPending(false);
  }}
/>

<button
  onClick={verifyRecipient}
  disabled={checkingRecipient}
>
  {checkingRecipient
    ? "Checking..."
    : "Verify Recipient"}
</button>

{recipientStatus?.exists && (
  <p style={{ color: "green" }}>
    ✅ Account Found
  </p>
)}

{recipientStatus &&
  !recipientStatus.exists && (
    <>
      <p style={{ color: "orange" }}>
        Recipient isn't on ConfessionVault.
        We'll deliver it if they join within
        7 days.
      </p>

      <button
        onClick={() => setAllowPending(true)}
      >
        Send Anyway
      </button>
    </>
)}

        <label>Message</label>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label>From</label>

        <textarea value={from} onChange={(e) => setFrom(e.target.value)} />

        <button onClick={downloadPages}>Download Pages</button>

        <button
  disabled={
    !recipientStatus ||
    (!recipientStatus.exists &&
      !allowPending)
  }
  onClick={() => {
    submitConfession(
      to,
      message,
      allowPending
    );
  }}
>
  Submit Confession
</button>
      </div>

      <div className="preview-wrapper" id="previewWrapper" />

      <div className="template" id="template" style={{ display: "none" }}>
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
