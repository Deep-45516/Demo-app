import { useState } from "react";

export default function AdminLogin({ onLogin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {

    const res = await fetch(
      "https://demo-app-se5t.onrender.com/api/v1/auth/admin-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await res.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    localStorage.setItem(
      "adminToken",
      data.data.token
    );

    onLogin();
  };

  return (
    <div>

      <h1>Admin Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <button onClick={login}>
        Login
      </button>

    </div>
  );
}