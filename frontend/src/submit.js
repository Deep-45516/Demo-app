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

  try {

    const res = await fetch(
      `${API}/api/v1/confessions`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          to,
          from,
          message,
          userEmail
        })
      }
    );

    const data = await res.json();

    console.log(data);

    alert("Submitted!");

  } catch (error) {

    console.error(error);

  }
}