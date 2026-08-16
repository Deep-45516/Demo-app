import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";

import { generatePages } from "../pageGenerator.js";
import { submitConfession } from "../submit.js";
import { downloadPages } from "../download.js";
import { searchRecipient } from "../searchRecipient.js";
import { connectSocket, disconnectSocket } from "../socket";

const API = import.meta.env.VITE_BACKEND_URL;

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [recipientStatus, setRecipientStatus] = useState(null); //null(we havent check is he registered or not,true(registered recipient),false(not registered))
  const [allowPending, setAllowPending] = useState(false); //If recipient doesn't exist, did the sender explicitly choose "Send Anyway"?initialyy it is false , so no
  const [publicConsent, setPublicConsent] = useState(false);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  //Has this browser already logged into ConfessionVault?
  /*If stored exists:
Convert the JSON string back into an object.
Otherwise:
Return null. */
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  //this connect the user to socketwhen login,(always connected to socket)
  // useEffect(() => {
  //   if (!user) return;

  //   connectSocket();
  // }, [user]);
  //useeffect trigged when to, from, or message changes. It generates the pages for preview.
  useEffect(() => {
    document.fonts.ready.then(() => {
      //this is promis(something that may finish letter then only "then" part will run)this load the font then go to requestAnimationFrame(() => {means roughly:Browser, run this right before your nextvisual repaint.and then generatePage
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
      /*result = {
  success: true,
  data: {
    exists: true,
    username: "_dummy_2026"
  }
} */
      setRecipientStatus(result.data);
      /*{recipientStatus?.exists && (
  <p>✅ Recipient verified.</p>
)} this becaomes true */
      // After setRecipientStatus(), React re-renders.
      // If recipientStatus.exists is true, this condition becomes true,
      // so the "Recipient verified" message is displayed.

      setAllowPending(false);
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingRecipient(false);
    } //finally runs whether try succeeded or failed.this setcheckingrecipent bring back "checking..." to normal button
  };

  const logoutUser = () => {
    // disconnectSocket();

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

                // Create socket connection immediately
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
            // Recipient changed, so previous verification is no longer valid.
            // Reset verification status and require the user to verify again.
            setTo(e.target.value);
            setRecipientStatus(null);
            setAllowPending(false);
            setPublicConsent(false);
          }}
        />
        <p
          style={{
            color: "#666",
            fontSize: "14px",
            marginBottom: "8px",
          }}
        >
          You must verify the recipient before sending a confession.
        </p>
        <button onClick={verifyRecipient} disabled={checkingRecipient}>
          {checkingRecipient ? "Checking..." : "Verify Recipient"}
        </button>
        {recipientStatus?.exists && (
          <p style={{ color: "green" }}>
            ✅ Recipient verified. You can now send your confession.
          </p>
        )}
        {recipientStatus && !recipientStatus.exists && (
          <>
            <p style={{ color: "orange" }}>
              ⚠️ This user hasn't joined ConfessionVault yet. You can still send
              your confession. We'll securely store it for up to 7 days and
              automatically deliver it if they join.
            </p>

            <button onClick={() => setAllowPending(true)}>Send Anyway</button>
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
        //checkbox for public post consent
        {recipientStatus?.exists && (
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginTop: 15,
              marginBottom: 15,
            }}
          >
            <input
              type="checkbox"
              checked={publicConsent}
              onChange={(e) => setPublicConsent(e.target.checked)}
            />

            <span>
              I'm okay with this confession being shared publicly if they also
              choose to share it.
            </span>
          </label>
        )}
        <button
          disabled={
            !recipientStatus ||
            checkingRecipient ||
            (!recipientStatus.exists && !allowPending)
          }
          onClick={() => {
            submitConfession(to, message, allowPending, publicConsent);
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
