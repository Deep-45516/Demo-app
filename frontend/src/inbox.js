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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Request failed."
    );
  }

  return data;
}

export function getInbox() {
  return request("inbox");
}

export function getConfession(id) {
  return request(id);
}