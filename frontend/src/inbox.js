const API = import.meta.env.VITE_BACKEND_URL;

async function request(endpoint) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API}/api/v1/confessions/${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
}

export function getReceivedConfessions() {
  return request("received");
}

export function getSentConfessions() {
  return request("sent");
}