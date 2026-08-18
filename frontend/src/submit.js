const API = import.meta.env.VITE_BACKEND_URL;

export async function submitConfession(
  recipientUsername,
  to,
  message,
  from,
  allowPending = false,
  publicConsent = false
) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("You are not logged in.");
  }

  const res = await fetch(
    `${API}/api/v1/confessions`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        recipientUsername: recipientUsername.trim(),

        to: to.trim(),
        message: message.trim(),
        from: from.trim(),

        allowPending,

        publicConsent,
      }),
    }
  );

  const data = await res.json();

  console.log(
    "SUBMIT CONFESSION RESPONSE:",
    data
  );

  if (!res.ok) {
    throw new Error(
      data.message || "Submission failed."
    );
  }

  return data;
}