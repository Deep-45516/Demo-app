export async function submitConfession(to, from, message) {
  console.log({
    to,
    from,
    message
  });
  try {
    const res = await fetch("http://localhost:3000/api/v1/confessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ to, from, message })
    });

    const data = await res.json();
    console.log(data);
    alert("Submitted!");

  } catch (err) {
    console.error(error.stack);
  }
}