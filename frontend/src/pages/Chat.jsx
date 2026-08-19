//C:\Users\yashl\OneDrive\Desktop\clean-repo\frontend\src\pages\Chat.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../wavelength.css"
import { getMessages, sendMessage } from "../chat/chat.js";

import { requestReveal, respondToReveal } from "../reveal/reveal.js";

import { getSocket, connectSocket } from "../socket";

import RevealSection from "../chat/RevealSection.jsx";
import { publishConfessionPublicly } from "../publicPost.js";

export default function Chat() {
  const { conversationId } = useParams();

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [remainingMessages, setRemainingMessages] = useState(null);

  const [revealStatus, setRevealStatus] = useState("none");

  const [revealRequestedBy, setRevealRequestedBy] = useState(null);

  const [revealLoading, setRevealLoading] = useState(false);

  const [revealedIdentity, setRevealedIdentity] = useState(null);

  const [autoOpenIdentity, setAutoOpenIdentity] = useState(false);

  const [revealNotice, setRevealNotice] = useState("");

  const [conversationSenderId, setConversationSenderId] = useState(null);

  const [publicConsent, setPublicConsent] = useState(false);

  const [publicPosted, setPublicPosted] = useState(false);

  const [instagramPostId, setInstagramPostId] = useState(null);

  // Current logged-in user
  const storedUser = localStorage.getItem("user");

  const user = storedUser ? JSON.parse(storedUser) : null;

  const userId = user?._id;

  // =========================
  // LOAD CHAT + SOCKET
  // =========================

  useEffect(() => {
    loadMessages();

    const socket = getSocket() || connectSocket();

    if (!socket) return;

    // New chat message
    function handleNewMessage(data) {
      const message = data.message;

      if (message.conversationId !== conversationId) {
        return;
      }

      setMessages((current) => {
        const alreadyExists = current.some((item) => item._id === message._id);

        if (alreadyExists) {
          return current;
        }

        setRemainingMessages((remaining) =>
          remaining === null ? remaining : Math.max(remaining - 1, 0),
        );

        return [...current, message];
      });
    }

    // Reveal request / response
    function handleRevealUpdated(data) {
      if (data.conversationId !== conversationId) {
        return;
      }

      console.log("🔥 REVEAL UPDATED:", data);

      setRevealStatus(data.status);

      // =========================
      // PENDING
      // =========================

      if (data.status === "pending") {
        setRevealRequestedBy(data.requestedBy || null);

        return;
      }

      // =========================
      // NOT YET
      // =========================

      if (data.decision === "not_yet") {
        setRevealStatus("none");

        setRevealRequestedBy(null);

        setRevealNotice(
          "🌱 They're not ready to reveal yet. You can keep talking anonymously.",
        );

        return;
      }

      // =========================
      // REVEALED
      // =========================

      if (data.status === "revealed") {
        setRevealRequestedBy(null);

        setRevealedIdentity(data.identity || null);

        setAutoOpenIdentity(true);

        setRevealNotice("");
      }
    }

    socket.on("new-message", handleNewMessage);

    socket.on("reveal-updated", handleRevealUpdated);

    return () => {
      socket.off("new-message", handleNewMessage);

      socket.off("reveal-updated", handleRevealUpdated);
    };
  }, [conversationId]);

  // =========================
  // LOAD MESSAGES
  // =========================

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");

      const response = await getMessages(conversationId);

      setMessages(response.data.messages || []);

      setRemainingMessages(response.data.remainingMessages);

      setConversationSenderId(response.data.senderUser);

      setPublicConsent(
  response.data.publicConsent || false
);

setPublicPosted(
  response.data.publicPosted || false
);

setInstagramPostId(
  response.data.instagramPostId || null
);
      // If backend already provides
      // reveal information, use it.
      if (response.data.revealStatus) {
        setRevealStatus(response.data.revealStatus);
      }

      if (response.data.revealRequestedBy) {
        setRevealRequestedBy(response.data.revealRequestedBy);
      }

      setRevealedIdentity(response.data.revealedIdentity || null);

      setAutoOpenIdentity(false);
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to load messages.");
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

      const response = await sendMessage(conversationId, text);

      setMessages((current) => [...current, response.data.message]);

      setRemainingMessages(response.data.remainingMessages);

      // setPublicConsent(response.data.publicConsent || false);

      // setPublicPosted(response.data.publicPosted || false);

      // setInstagramPostId(response.data.instagramPostId || null);

      setText("");
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

async function handlePublishPublicly() {
  try {
    setError("");

    const response =
      await publishConfessionPublicly(
        conversationId
      );

    setPublicPosted(true);

    setInstagramPostId(
      response.data?.instagramPostId ||
        null
    );
  } catch (error) {
    console.error(error);

    setError(
      error.message ||
        "Unable to share confession publicly."
    );
  }
}

  // =========================
  // ASK FOR REVEAL
  // =========================

  async function handleRequestReveal() {
    try {
      setRevealLoading(true);
      setError("");

      const response = await requestReveal(conversationId);

      setRevealStatus(response.data.status);

      setRevealRequestedBy(response.data.requestedBy);
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to request reveal.");
    } finally {
      setRevealLoading(false);
    }
  }

  // =========================
  // RESPOND TO REVEAL
  // =========================

  async function handleRevealResponse(decision) {
    try {
      setRevealLoading(true);
      setError("");

      const response = await respondToReveal(conversationId, decision);

      setRevealStatus(response.data.status);

      setRevealRequestedBy(null);

      if (decision === "reveal") {
        setRevealedIdentity(response.data.identity);

        setAutoOpenIdentity(true);

        setRevealNotice("");
      }
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to respond to reveal request.");
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
            {remainingMessages === 1 ? "message" : "messages"} left in this
            conversation.
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
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              style={{
                marginBottom: 10,
              }}
            >
              <strong>{message.senderUser}</strong>

              <p>{message.text}</p>

              <small>{new Date(message.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>

      {/* =========================
          REVEAL SECTION
          ========================= */}

      <RevealSection
        userId={userId}
        conversationSenderId={conversationSenderId}
        remainingMessages={remainingMessages}
        revealStatus={revealStatus}
        revealRequestedBy={revealRequestedBy}
        revealLoading={revealLoading}
        revealedIdentity={revealedIdentity}
        revealNotice={revealNotice}
        autoOpenIdentity={autoOpenIdentity}
        onRequestReveal={handleRequestReveal}
        onRevealResponse={handleRevealResponse}
      />

      {/* =========================
    PUBLIC CONFESSION
    ========================= */}

{publicConsent &&
 !publicPosted &&
 String(userId) !==
 String(conversationSenderId) && (
  <div
    style={{
      marginBottom: 20,
      padding: 15,
      border: "1px solid #ddd",
      borderRadius: 10,
    }}
  >
    <p>
      ✨ You both agreed to make this
      confession public.
    </p>

    <button
      onClick={handlePublishPublicly}
    >
      📸 Post on Instagram
    </button>
  </div>
)}

{publicPosted && (
  <div
    style={{
      marginBottom: 20,
      padding: 15,
      border: "1px solid #ddd",
      borderRadius: 10,
    }}
  >
    <p>
      ✨ This confession is now public
      on Instagram.
    </p>

    {instagramPostId && (
      <small>
        Instagram post created successfully.
      </small>
    )}
  </div>
)}

      {/* =========================
          MESSAGE INPUT
          ========================= */}

      {remainingMessages === 0 ? (
        <p>This conversation has reached its limit.</p>
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
            onChange={(event) => setText(event.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            style={{
              flex: 1,
              padding: 10,
            }}
          />

          <button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
