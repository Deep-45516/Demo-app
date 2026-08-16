const API = import.meta.env.VITE_BACKEND_URL;

export async function publishConfessionPublicly(
  confessionId
) {
  const token =
    localStorage.getItem("token");

  const res = await fetch(
    `${API}/api/v1/confessions/${confessionId}/public`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
        "Unable to share confession publicly."
    );
  }

  return data;
}