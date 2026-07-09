import { useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function InstagramVerification() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

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

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Verification failed.");
        return;
      }
      const sessionId = data.data.sessionId;

      const code = data.data.code;

      // Copy verification code automatically
      try {
        await navigator.clipboard.writeText(code);
      } catch (err) {
        console.error("Clipboard Error:", err);
      }

      // Your Professional Instagram username
      const businessUsername = "wit_confessions.26";

      // Open Instagram DM
      window.open(`https://ig.me/m/${businessUsername}`, "_blank");

      // Show instructions
      alert(
        `✅ Verification code copied successfully!

Next Steps:

1. Instagram has been opened.
2. Open the chat with @${businessUsername}.
3. Paste the copied verification code.
4. Send the message.
5. Come back to this page.

Your account will be verified automatically once we receive the message.`,
      );
      let interval;

      const timeout = setTimeout(
        () => {
          clearInterval(interval);
          alert("Verification timed out. Please try again.");
        },
        5 * 60 * 1000,
      );
      interval = setInterval(async () => {
        try {
          const res = await fetch(
            `${API}/api/v1/auth/instagram/status/${sessionId}`,
          );

          const data = await res.json();

          if (data?.data?.status === "verified") {
            clearInterval(interval);
            clearTimeout(timeout);

            localStorage.setItem("token", data.data.token);

            window.location.href = "/";
          }
        } catch (err) {
          console.error(err);
          clearInterval(interval);
          clearTimeout(timeout);
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

      <button onClick={verify} disabled={loading}>
        {loading ? "Generating..." : "Verify"}
      </button>
    </div>
  );
}
