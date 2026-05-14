import { useState, useEffect, use } from "react";

import { generatePages } from "../pageGenerator.js";
import { submitConfession } from "../submit.js";
import { downloadPages } from "../download.js";

import { signInWithPopup,onAuthStateChanged,signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";

export default function Home() {

  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsub();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);  
    } catch (error) {
      console.error("Error logging in with Google:", error);
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

        generatePages(
          to,
          from,
          message
        );

      });

    });

  }, [to, from, message]);

  return (

    <div className="container">


      {!user ? (
  <div>
    <h2>Login to submit confession</h2>

    <button onClick={loginWithGoogle}>
      Continue with Google
    </button>
  </div>
) : (
  <div>
    <p>Logged in as {user.email}</p>

    <button onClick={logoutUser}>
      Logout
    </button>

    {/* Your confession form here */}
  </div>
)}

      {/* FORM */}
      <div className="form">

        <label>
          To
        </label>

        <textarea
          id="toInput"
          value={to}
          onChange={(e) =>
            setTo(e.target.value)
          }
        />

        <label>
          Message
        </label>

        <textarea
          id="messageInput"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
        />

        <label>
          From
        </label>

        <textarea
          id="fromInput"
          value={from}
          onChange={(e) =>
            setFrom(e.target.value)
          }
        />

        <button
          onClick={downloadPages}
        >
          Download Pages
        </button>

        <button
          onClick={() =>
            submitConfession(
              to,
              from,
              message,
              user.email
            )
          }
        >
          Submit Confession
        </button>

      </div>

      {/* GENERATED PAGES */}
      <div
        className="preview-wrapper"
        id="previewWrapper"
      />

      {/* HIDDEN TEMPLATE */}

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