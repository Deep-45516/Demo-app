const API = import.meta.env.VITE_BACKEND_URL;

// Common API helper
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API}/api/v1/confessions/${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
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

export function updateConfessionAction(
  confessionId,
  action
) {
  return request(`${confessionId}/action`, {
    method: "PATCH",
    body: JSON.stringify({
      action,
    }),
  });
}

export function markConfessionRead(confessionId) {
  return request(`${confessionId}/read`, {
    method: "PATCH",
  });
}