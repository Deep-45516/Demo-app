import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConversations } from "../chat/chat.js";

import { getInbox } from "../inbox";
import {
  subscribeToNewConfession,
  unsubscribeFromNewConfession,
} from "../socket";

export default function Inbox() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("received");

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadInbox();
    loadConversations();
    async function handleNewConfession(data) {
      console.log("🔥 EVENT");
      console.log(data);

      await loadInbox();

      console.log("🔥 Inbox Reloaded");
    }

    subscribeToNewConfession(handleNewConfession);

    return () => {
      unsubscribeFromNewConfession(handleNewConfession);
    };
  }, []);

  async function loadInbox() {
    try {
      setLoading(true);

      const response = await getInbox();

      setReceived(response.data.received || []);
      setSent(response.data.sent || []);
    } catch (error) {
      console.error(error);
      setError("Unable to load inbox.");
    } finally {
      setLoading(false);
    }
  }
  async function loadConversations() {
  try {
    const response =
      await getConversations();

    setConversations(
      response.data || []
    );
  } catch (error) {
    console.error(
      "Unable to load conversations:",
      error
    );
  }
}

  const list = tab === "received" ? received : sent;

  if (loading) {
    return <p>Loading inbox...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Inbox</h2>

      <button onClick={() => setTab("received")}>
        Received ({received.length})
      </button>

      <button onClick={() => setTab("sent")}>Sent ({sent.length})</button>

      <hr />

      {list.length === 0 && <p>No {tab} confessions yet.</p>}

      {list.map((confession) => (
        <div
          key={confession._id}
          onClick={() => navigate(`/confessions/${confession._id}`)}
          style={{
            border: "1px solid #555",
            padding: 15,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <strong>
            {tab === "received"
              ? confession.senderAnonymousName
              : `@${confession.recipientInstagramUsername}`}
          </strong>

          <p>{new Date(confession.createdAt).toLocaleString()}</p>

          {tab === "received" && <small>{confession.recipientAction}</small>}

          {tab === "sent" && <small>{confession.deliveryStatus}</small>}
        </div>
      ))}
      <hr />

<h2>Chats</h2>

{conversations.length === 0 && (
  <p>No active chats.</p>
)}

{conversations.map((conversation) => (
  <div
    key={conversation._id}
    onClick={() =>
      navigate(
        `/chat/${conversation._id}`
      )
    }
    style={{
      border: "1px solid #555",
      padding: 15,
      marginBottom: 10,
      cursor: "pointer",
    }}
  >
    <strong>
      {conversation.displayName}
    </strong>

    <p>
      {conversation.lastMessage?.text ||
        "No messages yet"}
    </p>

    {conversation.lastMessageAt && (
      <small>
        {new Date(
          conversation.lastMessageAt
        ).toLocaleString()}
      </small>
    )}
  </div>
))}
    </div>
    
  );
}
