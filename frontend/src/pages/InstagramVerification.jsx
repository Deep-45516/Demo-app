import { useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function InstagramVerification() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!username.trim()) {
      alert("Enter Instagram username");
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
            username,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      const code = data.data.code;

      // TODO: replace with your Professional account username
      const businessUsername = "wit_confessions.26";

      const message = encodeURIComponent(
        `ConfessionVault Verification\n\n${code}`,
      );

      window.open(
        `https://ig.me/m/${businessUsername}?text=${message}`,
        "_blank",
      );
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
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
        {loading
          ? "Generating..."
          : "Verify"}
      </button>
    </div>
  );
}