const API =
  import.meta.env.VITE_BACKEND_URL;

export async function requestReveal(
  conversationId
) {
  const response = await fetch(
    `${API}/api/v1/reveal/${conversationId}/request`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to request reveal."
    );
  }

  return data;
}


export async function respondToReveal(
  conversationId,
  decision
) {
  const response = await fetch(
    `${API}/api/v1/reveal/${conversationId}/respond`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        decision,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to respond."
    );
  }

  return data;
}