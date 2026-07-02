const API = import.meta.env.VITE_BACKEND_URL;

export async function submitConfession(
  to,
  from,
  message,
  userEmail
) {
  console.log({
    to,
    from,
    message,
    userEmail
  });
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/v1/confessions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    to,
    from,
    message,
  }),
});

    const data = await res.json();
    console.log(data);

    alert("Submitted!");
  } catch (error) {
    console.error(error);
  }
}