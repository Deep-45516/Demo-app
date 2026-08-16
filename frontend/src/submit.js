const API = import.meta.env.VITE_BACKEND_URL;

// User has verified the recipient and clicks submit.
export async function submitConfession(
  recipientUsername,
  message,
  allowPending = false,
  publicConsent = false
) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/v1/confessions`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        recipientUsername,
        message,
        allowPending,
        publicConsent,
      }),
    });

    const data = await res.json();

    console.log(data);

    if (!res.ok) {
      alert(data.message || "Submission failed");
      return;
    }

    alert("Submitted!");
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
  }
}