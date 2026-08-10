const API = import.meta.env.VITE_BACKEND_URL;

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}


// Get all conversations for the logged-in user
export async function getConversations() {
  const response = await fetch(
    `${API}/api/v1/chat/conversations`,
    {
      headers: authHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Unable to load conversations."
    );
  }

  return data;
}


// Get messages of one conversation
export async function getMessages(
  conversationId,
  cursor = null,
  limit = 20
) {
  const params = new URLSearchParams();

  params.set("limit", limit);

  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(
    `${API}/api/v1/chat/${conversationId}/messages?${params}`,
    {
      headers: authHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Unable to load messages."
    );
  }

  return data;
}


// Send one message
export async function sendMessage(
  conversationId,
  text
) {
  const response = await fetch(
    `${API}/api/v1/chat/${conversationId}/messages`,
    {
      method: "POST",

      headers: authHeaders(),

      body: JSON.stringify({
        text,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Unable to send message."
    );
  }

  return data;
}