import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function InstagramVerification() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
//useRef is used to store mutable values that do not cause a re-render when updated, it save values that we want to use later.
// setInterval() runs the same code again and again after a fixed time.
// Here, it checks the verification status every 2 seconds.
// setTimeout() runs the code only once after a fixed time.
// Here, it stops the verification process after 5 minutes.
// We store their IDs in useRef so we can stop them later using clearInterval() and clearTimeout().
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

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
      const { sessionId, code } = data.data;
      console.log(sessionId);

      // Copy verification code
      try {
        await navigator.clipboard.writeText(code);
      } catch (err) {
        console.error("Clipboard Error:", err);
      }

      const businessUsername = "wit_confessions.26";
alert(`${code}✅ Code copied!

Opening Instagram...

Check you're on @${username}, send the code, and come back. 
We are waiting for you...`);
      // Open Instagram DM
      window.open(
        `https://ig.me/m/${businessUsername}`,
        "_blank"
      );//blank means open in new tab & self means open in same tab

      // Stop after 5 minutes
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);

        alert(
          "Verification session expired.\n\nPlease generate a new verification code."
        );
      }, 5 * 60 * 1000);

      // Poll backend every 2 seconds
      intervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `${API}/api/v1/auth/instagram/status/${sessionId}`
          );

          const data = await res.json();

          if (!res.ok) {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);

            alert(data.message || "Verification failed.");
            return;
          }

          if (data.data.status === "verified") {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);

            localStorage.setItem(
              "token",
              data.data.token
            );

            alert("Instagram verified successfully!");

            window.location.href = "/anonymous";
            // window.location.reload();//reload the page to reflect the new authentication state
          }
        } catch (err) {
          console.error(err);

          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);

          alert(
            "Unable to contact the server. Please try again."
          );
        }
      }, 2000);

    } catch (err) {
      console.error(err);

      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Verify Instagram</h2>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Instagram username"
      />

      <br />
      <br />

      <button
        onClick={verify}
        disabled={loading}
      >
        {loading ? "Generating..." : "Verify"}
      </button>
    </div>
  );
}