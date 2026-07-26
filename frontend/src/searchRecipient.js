const API = import.meta.env.VITE_BACKEND_URL;

export async function searchRecipient(username) {
  const token = localStorage.getItem("token");
//we retrive the jwt to confirm Is person making this request actually logged in?
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
//backend gives json response, we need to convert it to object
  return res.json();
}