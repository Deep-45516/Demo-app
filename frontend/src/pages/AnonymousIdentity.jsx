import { useEffect, useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function AnonymousIdentity() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setProfile(data.data.anonymousProfile);
    };

    load();
  }, []);

  if (!profile) return <p>Loading...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>🎉 Welcome!</h1>

      <h3>Your anonymous identity is</h3>

      <h2>{profile.anonymousName}</h2>

      <button
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Continue
      </button>
    </div>
  );
}