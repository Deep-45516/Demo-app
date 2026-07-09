import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function InstagramVerification() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

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

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Verification failed.");
        return;
      }

      const { sessionId, code } = data.data;
      console.log(sessionId);

      // Copy verification code
      try {
        await navigator.clipboard.writeText(code);
      } catch (err) {
        console.error("Clipboard Error:", err);
      }

      const businessUsername = "wit_confessions.26";

      // Open Instagram DM
      window.open(
        `https://ig.me/m/${businessUsername}`,
        "_blank"
      );

      alert(`✅ Verification code copied!

Next Steps:

1. Instagram has been opened.
2. Open the chat with @${businessUsername}.
3. Paste the copied verification code.
4. Send the message.
5. Return to this page.

Verification will happen automatically.`);

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

            window.location.reload();
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