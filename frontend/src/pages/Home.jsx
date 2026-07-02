import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";

import { generatePages } from "../pageGenerator.js";
import { submitConfession } from "../submit.js";
import { downloadPages } from "../download.js";

const API = import.meta.env.VITE_BACKEND_URL;

export default function Home() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        generatePages(to, from, message);
      });
    });
  }, [to, from, message]);

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
                localStorage.setItem(
                  "user",
                  JSON.stringify(data.data.user)
                );

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

        <label>To</label>

        <textarea
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <label>Message</label>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label>From</label>

        <textarea
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <button onClick={downloadPages}>
          Download Pages
        </button>

        <button
          onClick={() => {
            submitConfession(
              to,
              from,
              message
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