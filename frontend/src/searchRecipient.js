const API = import.meta.env.VITE_BACKEND_URL;

export async function searchRecipient(username) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${API}/api/v1/confessions/search-recipient?username=${encodeURIComponent(
      username
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
}