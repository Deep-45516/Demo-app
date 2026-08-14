import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getMessages,
  sendMessage,
} from "../chat/chat.js";

import {
  getSocket,
  connectSocket,
} from "../socket";


export default function Chat() {
  const { conversationId } =
    useParams();

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [remainingMessages, setRemainingMessages] =
  useState(null);

useEffect(() => {
  loadMessages();

  const socket =
    getSocket() || connectSocket();

  if (!socket) return;

function handleNewMessage(data) {
  const message = data.message;

  if (
    message.conversationId !==
    conversationId
  ) {
    return;
  }

  setMessages((current) => {
    const alreadyExists =
      current.some(
        (item) =>
          item._id === message._id
      );

    if (alreadyExists) {
      return current;
    }

    setRemainingMessages((remaining) =>
      remaining === null
        ? remaining
        : Math.max(remaining - 1, 0)
    );

    return [...current, message];
  });
}

  socket.on(
    "new-message",
    handleNewMessage
  );

  return () => {
    socket.off(
      "new-message",
      handleNewMessage
    );
  };
}, [conversationId]);


 async function loadMessages() {
  try {
    setLoading(true);
    setError("");

    const response =
      await getMessages(
        conversationId
      );

    setMessages(
      response.data.messages || []
    );

    setRemainingMessages(
      response.data.remainingMessages
    );

  } catch (error) {
    console.error(error);

    setError(
      error.message ||
      "Unable to load messages."
    );

  } finally {
    setLoading(false);
  }
}


  async function handleSend(
    event
  ) {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response =
        await sendMessage(
          conversationId,
          text
        );

      /*
        Backend has saved the message.

        Add the returned message
        directly to our UI.
      */
setMessages((current) => [
  ...current,
  response.data.message,
]);

setRemainingMessages(
  response.data.remainingMessages
);

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to send message."
      );

    } finally {
      setSending(false);
    }
  }


  if (loading) {
    return <p>Loading chat...</p>;
  }


  return (
    <div
      style={{
        padding: 30,
        maxWidth: 700,
        margin: "auto",
      }}
    >
      <h2>Chat</h2>
      {remainingMessages !== null &&
  remainingMessages <= 4 &&
  remainingMessages > 0 && (
    <p>
      {remainingMessages}{" "}
      {remainingMessages === 1
        ? "message"
        : "messages"}{" "}
      left in this conversation.
    </p>
  )}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <div
        style={{
          border: "1px solid #ccc",
          padding: 15,
          minHeight: 400,
          marginBottom: 15,
        }}
      >
        {messages.length === 0 ? (
          <p>
            No messages yet.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              style={{
                marginBottom: 10,
              }}
            >
              <strong>
                {message.senderUser}
              </strong>

              <p>
                {message.text}
              </p>

              <small>
                {new Date(
                  message.createdAt
                ).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>


{remainingMessages === 0 ? (
  <p>
    This conversation has reached its limit.
  </p>
) : (
  <form
    onSubmit={handleSend}
    style={{
      display: "flex",
      gap: 10,
    }}
  >
    <input
      value={text}
      onChange={(event) =>
        setText(event.target.value)
      }
      placeholder="Type a message..."
      disabled={sending}
      style={{
        flex: 1,
        padding: 10,
      }}
    />

    <button
      type="submit"
      disabled={sending}
    >
      {sending ? "Sending..." : "Send"}
    </button>
  </form>
)}
    </div>
  );
}