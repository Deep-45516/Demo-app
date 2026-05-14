import { useState, useEffect } from "react";

import { generatePages } from "../pageGenerator.js";
import { submitConfession } from "../submit.js";
import { downloadPages } from "../download.js";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  auth,
  googleProvider
} from "../firebase.js";

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    if (loginLoading) return;

    try {
      setLoginLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error logging in with Google:", error);
    } finally {
      setLoginLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        generatePages(to, from, message);
      });
    });
  }, [to, from, message]);

  if (!user) {
    return (
      <div className="container">
        <div className="form">
          <h2>Login to submit confession</h2>

          <button
            disabled={loginLoading}
            onClick={loginWithGoogle}
          >
            {loginLoading
              ? "Opening..."
              : "Continue with Google"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">

      <div className="form">

        <p>
          Logged in as {user.email}
        </p>

        <button onClick={logoutUser}>
          Logout
        </button>

        <label>To</label>

        <textarea
          id="toInput"
          value={to}
          onChange={(e) =>
            setTo(e.target.value)
          }
        />

        <label>Message</label>

        <textarea
          id="messageInput"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
        />

        <label>From</label>

        <textarea
          id="fromInput"
          value={from}
          onChange={(e) =>
            setFrom(e.target.value)
          }
        />

        <button onClick={downloadPages}>
          Download Pages
        </button>

        <button
          onClick={() => {
            if (!user) {
              alert("Please login first");
              return;
            }

            submitConfession(
              to,
              from,
              message,
              user?.email
            );
          }}
        >
          Submit Confession
        </button>

      </div>

      <div
        className="preview-wrapper"
        id="previewWrapper"
      />

      <div
        className="template"
        id="template"
        style={{ display: "none" }}
      >
        <div className="to">
          <h2 className="previewTo">
            Someone
          </h2>
        </div>

        <div className="message"></div>

        <div className="from">
          <h3 className="previewFrom">
            Unknown
          </h3>
        </div>
      </div>

    </div>
  );
}