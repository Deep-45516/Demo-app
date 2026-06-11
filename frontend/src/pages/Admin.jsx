import { useEffect, useState } from "react";
import { enableAdminNotifications } from "../notifications.js";

const API = import.meta.env.VITE_BACKEND_URL;

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);

  const loginAdmin = async () => {
    const res = await fetch(`${API}/api/v1/auth/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Login failed");
      return;
    }

    localStorage.setItem("adminToken", data.data.token);
    setToken(data.data.token);
  };

  const fetchData = async () => {
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const pendingRes = await fetch(`${API}/api/v1/confessions/pending`, {
      headers,
    });

    const approvedRes = await fetch(
      `${API}/api/v1/confessions/approved/recent`,
      { headers },
    );

    const rejectedRes = await fetch(
      `${API}/api/v1/confessions/rejected/recent`,
      { headers },
    );

    if (pendingRes.status === 401) {
      localStorage.removeItem("adminToken");
      setToken("");
      return;
    }

    const pendingData = await pendingRes.json();
    const approvedData = await approvedRes.json();
    const rejectedData = await rejectedRes.json();

    setPending(pendingData.data || []);
    setApproved(approvedData.data || []);
    setRejected(rejectedData.data || []);
  };

  const approveConfession = async (id, caption) => {
    await fetch(`${API}/api/v1/confessions/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ caption }),
    });

    fetchData();
  };

  const rejectConfession = async (id) => {
    await fetch(`${API}/api/v1/confessions/${id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchData();
  };
  const retryPost = async (id) => {
  await fetch(
    `${API}/api/v1/confessions/${id}/retry-post`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  fetchData();
};

  const logout = () => {
    localStorage.removeItem("adminToken");
    setToken("");
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [token]);

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Admin Login</h1>

        <input
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button onClick={loginAdmin}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Panel</h1>

      <button onClick={logout}>Logout</button>
      <button onClick={enableAdminNotifications}>Enable Notifications</button>

      <h2>Pending Requests</h2>

      {pending.map((confession) => (
        <div
          key={confession._id}
          style={{
            border: "1px solid gray",
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3>To: {confession.to}</h3>
          <p>{confession.message}</p>
          <p>From: {confession.from}</p>

          {confession.imageUrls?.map((url, index) => (
            <img
              key={index}
              src={url}
              alt=""
              width="250"
              style={{ display: "block", marginBottom: 10 }}
            />
          ))}

          <textarea
            id={`caption-${confession._id}`}
            placeholder="Optional caption"
            defaultValue={confession.caption || ""}
            style={{ width: "100%", height: 80 }}
          />

          <br />
          <br />

          <button
            onClick={() => {
              const caption = document.getElementById(
                `caption-${confession._id}`,
              ).value;

              approveConfession(confession._id, caption);
            }}
          >
            Approve
          </button>

          <button
            onClick={() => rejectConfession(confession._id)}
            style={{ marginLeft: 10 }}
          >
            Reject
          </button>
          {confession.postError && (
  <>
    <p style={{ color: "red" }}>
      Post failed: {confession.postError}
    </p>

    <button
      onClick={() =>
        retryPost(confession._id)
      }
    >
      Retry Post
    </button>
  </>
)}
        </div>
      ))}

      <h2>Recently Approved</h2>

      {approved.map((confession) => (
        <div key={confession._id}>
          <p>
            {confession.to} - {confession.status}
          </p>
        </div>
      ))}

      <h2>Recently Rejected</h2>

      {rejected.map((confession) => (
        <div key={confession._id}>
          <p>
            {confession.to} - {confession.status}
          </p>
        </div>
      ))}
    </div>
  );
}