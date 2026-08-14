import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getMessages,
  sendMessage,
} from "../chat/chat.js";

import {
  requestReveal,
  respondToReveal,
} from "../reveal/reveal.js";

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

  const [revealStatus, setRevealStatus] =
    useState("none");

  const [revealRequestedBy, setRevealRequestedBy] =
    useState(null);

  const [revealLoading, setRevealLoading] =
    useState(false);

  // Current logged-in user
  const storedUser =
    localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  const userId = user?._id;


  // =========================
  // LOAD CHAT + SOCKET
  // =========================

  useEffect(() => {
    loadMessages();

    const socket =
      getSocket() || connectSocket();

    if (!socket) return;


    // New chat message
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

        setRemainingMessages(
          (remaining) =>
            remaining === null
              ? remaining
              : Math.max(
                  remaining - 1,
                  0
                )
        );

        return [
          ...current,
          message,
        ];
      });
    }


    // Reveal request / response
    function handleRevealUpdated(data) {
      if (
        data.conversationId !==
        conversationId
      ) {
        return;
      }

      console.log(
        "🔥 REVEAL UPDATED:",
        data
      );

      setRevealStatus(
        data.status
      );

      setRevealRequestedBy(
        data.requestedBy || null
      );
    }


    socket.on(
      "new-message",
      handleNewMessage
    );

    socket.on(
      "reveal-updated",
      handleRevealUpdated
    );


    return () => {
      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.off(
        "reveal-updated",
        handleRevealUpdated
      );
    };
  }, [conversationId]);


  // =========================
  // LOAD MESSAGES
  // =========================

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

      // If backend already provides
      // reveal information, use it.
      if (
        response.data.revealStatus
      ) {
        setRevealStatus(
          response.data.revealStatus
        );
      }

      if (
        response.data.revealRequestedBy
      ) {
        setRevealRequestedBy(
          response.data.revealRequestedBy
        );
      }

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


  // =========================
  // SEND MESSAGE
  // =========================

  async function handleSend(event) {
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

      setMessages((current) => [
        ...current,
        response.data.message,
      ]);

      setRemainingMessages(
        response.data.remainingMessages
      );

      setText("");

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


  // =========================
  // ASK FOR REVEAL
  // =========================

  async function handleRequestReveal() {
    try {
      setRevealLoading(true);
      setError("");

      const response =
        await requestReveal(
          conversationId
        );

      setRevealStatus(
        response.data.status
      );

      setRevealRequestedBy(
        response.data.requestedBy
      );

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to request reveal."
      );

    } finally {
      setRevealLoading(false);
    }
  }


  // =========================
  // RESPOND TO REVEAL
  // =========================

  async function handleRevealResponse(
    decision
  ) {
    try {
      setRevealLoading(true);
      setError("");

      const response =
        await respondToReveal(
          conversationId,
          decision
        );

      setRevealStatus(
        response.data.status
      );

      setRevealRequestedBy(null);

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to respond to reveal request."
      );

    } finally {
      setRevealLoading(false);
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


      {/* Remaining messages */}

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
        <p
          style={{
            color: "red",
          }}
        >
          {error}
        </p>
      )}


      {/* =========================
          MESSAGES
          ========================= */}

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


      {/* =========================
          REVEAL SECTION
          ========================= */}

      {messages.length >= 7 &&
        revealStatus === "none" && (
          <div
            style={{
              marginBottom: 15,
            }}
          >
            <button
              onClick={
                handleRequestReveal
              }
              disabled={revealLoading}
            >
              {revealLoading
                ? "Sending..."
                : "✨ Ask to Reveal Identity"}
            </button>
          </div>
        )}


      {revealStatus === "pending" && (
        <div
          style={{
            marginBottom: 15,
          }}
        >

          {String(
            revealRequestedBy
          ) === String(userId) ? (

            <p>
              👀 Reveal request sent.
              Waiting for their response.
            </p>

          ) : (

            <>
              <p>
                👀 They want to know
                who you are.
              </p>

              <button
                onClick={() =>
                  handleRevealResponse(
                    "reveal"
                  )
                }
                disabled={
                  revealLoading
                }
              >
                ✨ Reveal Identity
              </button>

              <button
                onClick={() =>
                  handleRevealResponse(
                    "not_yet"
                  )
                }
                disabled={
                  revealLoading
                }
                style={{
                  marginLeft: 10,
                }}
              >
                Not Yet
              </button>
            </>

          )}

        </div>
      )}


      {revealStatus === "revealed" && (
        <p
          style={{
            marginBottom: 15,
          }}
        >
          ✨ Your identities have
          been revealed.
        </p>
      )}


      {/* =========================
          MESSAGE INPUT
          ========================= */}

      {remainingMessages === 0 ? (

        <p>
          This conversation has
          reached its limit.
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
              setText(
                event.target.value
              )
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
            {sending
              ? "Sending..."
              : "Send"}
          </button>

        </form>

      )}

    </div>
  );
}