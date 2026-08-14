import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getConfession, updateConfessionAction } from "../inbox";

import {
  getSocket,
  connectSocket,
} from "../socket";

export default function ConfessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [confession, setConfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);

  // Current logged-in user
  const storedUser = localStorage.getItem("user");

  const user = storedUser ? JSON.parse(storedUser) : null;

useEffect(() => {
  loadConfession();

  const socket =
    getSocket() || connectSocket();

  if (!socket) return;

  function handleConfessionUpdated(data) {
    if (data.confessionId !== id) {
      return;
    }

    setConfession((current) => {
      if (!current) return current;

      return {
        ...current,
        recipientAction:
          data.recipientAction,
        conversationId:
          data.conversationId,
      };
    });

    setConversationId(
      data.conversationId || null
    );
  }

  socket.on(
    "confession-updated",
    handleConfessionUpdated
  );

  return () => {
    socket.off(
      "confession-updated",
      handleConfessionUpdated
    );
  };
}, [id]);

  async function loadConfession() {
    try {
      setLoading(true);
      setError("");
      console.log("1. Loading confession:", id);
      const response = await getConfession(id);
       console.log("2. API response:", response);

      setConfession(response.data);

setConversationId(
  response.data.conversationId || null
);
console.log(
      "3. Confession loaded:",
      response.data
    );
    } catch (error) {
       console.error(
      "CONFESSION LOAD ERROR:",
      error
    );

      setError(error.message || "Unable to load confession.");
    } finally {
      console.log("4. Loading finished");
      setLoading(false);
    }
  }

  async function handleAction(action) {
    if (!confession) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await updateConfessionAction(confession._id, action);

      // Update React state immediately.
      // No page reload and no second GET request.
      setConfession(response.data);
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to respond.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <p>Loading confession...</p>;
  }

  if (error && !confession) {
    return <p>{error}</p>;
  }

  if (!confession) {
    return <p>Confession not found.</p>;
  }

  // These checks are for UI only.
  // Backend authorization is the real security.
  const isSender = confession.senderUser === user?._id;

  const isRecipient = confession.recipientUser === user?._id;

  return (
    <div style={{ padding: 30 }}>
      <button onClick={() => navigate("/inbox")}>← Back to Inbox</button>

      <h2>Confession</h2>

      <p>
        From: <strong>{confession.senderAnonymousName}</strong>
      </p>

      <p>
        To: <strong>@{confession.recipientInstagramUsername}</strong>
      </p>

      <p>{confession.message}</p>

      {confession.imageUrls?.map((url) => (
        <img
          key={url}
          src={url}
          alt="Confession"
          style={{
            width: "100%",
            maxWidth: 500,
            display: "block",
            marginBottom: 15,
          }}
        />
      ))}

      <p>Sent: {new Date(confession.createdAt).toLocaleString()}</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* =========================
          RECIPIENT VIEW
          ========================= */}

      {isRecipient && (
        <div
          style={{
            marginTop: 30,
            borderTop: "1px solid #ccc",
            paddingTop: 20,
          }}
        >
          <h3>Your Response</h3>

          {confession.recipientAction === "pending" && (
            <>
              <p>Are you curious about who sent this confession?</p>

              <button
                disabled={actionLoading}
                onClick={() => handleAction("curious")}
              >
                {actionLoading ? "Updating..." : "👀 Curious"}
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleAction("not_interested")}
                style={{
                  marginLeft: 10,
                }}
              >
                {actionLoading ? "Updating..." : "Not Interested"}
              </button>
            </>
          )}

{confession.recipientAction === "curious" && (
  <>
    <p>👀 You said you're curious.</p>

    {conversationId && (
      <button
        onClick={() =>
          navigate(`/chat/${conversationId}`)
        }
      >
        💬 Open Conversation
      </button>
    )}
  </>
)}

          {confession.recipientAction === "not_interested" && (
            <p>You're not interested in this confession.</p>
          )}
        </div>
      )}

      {/* =========================
          SENDER VIEW
          ========================= */}

      {isSender && (
        <div
          style={{
            marginTop: 30,
            borderTop: "1px solid #ccc",
            paddingTop: 20,
          }}
        >
          <h3>Recipient Response</h3>

          {confession.recipientAction === "pending" && (
            <p>⏳ Waiting for their response.</p>
          )}

          {confession.recipientAction ===
  "curious" && (
  <>
    <p>
      👀 They're curious about you.
    </p>

    {conversationId && (
      <button
        onClick={() =>
          navigate(
            `/chat/${conversationId}`
          )
        }
      >
        💬 Continue Conversation
      </button>
    )}
  </>
)}

          {confession.recipientAction === "not_interested" && (
            <p>They aren't interested.</p>
          )}
        </div>
      )}
    </div>
  );
}
