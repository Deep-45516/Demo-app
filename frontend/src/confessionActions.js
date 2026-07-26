const API = import.meta.env.VITE_BACKEND_URL;

export async function respondToConfession(
  confessionId,
  action
) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API}/api/v1/confessions/${confessionId}/action`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        action,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Unable to respond to confession."
    );
  }

  return data;
}