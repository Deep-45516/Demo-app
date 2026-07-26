const API = import.meta.env.VITE_BACKEND_URL;
//user has verified the recipent and clicks sunbmit
export async function submitConfession(
  recipientUsername,
  message,
  allowPending = false
) {
//simmilar as search recipent , just post req becuz we are sending info to create confession
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/v1/confessions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
body: JSON.stringify({//JSON.stringify() turns it into JSON text for the HTTP request
  recipientUsername,
  message,
  allowPending,
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