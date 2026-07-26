import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getInbox } from "../inbox";

export default function Inbox() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("received");

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInbox();
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

  const list =
    tab === "received"
      ? received
      : sent;

  if (loading) {
    return <p>Loading inbox...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Inbox</h2>

      <button
        onClick={() => setTab("received")}
      >
        Received ({received.length})
      </button>

      <button
        onClick={() => setTab("sent")}
      >
        Sent ({sent.length})
      </button>

      <hr />

      {list.length === 0 && (
        <p>
          No {tab} confessions yet.
        </p>
      )}

      {list.map((confession) => (
        <div
          key={confession._id}
          onClick={() =>
            navigate(
              `/confessions/${confession._id}`
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
            {tab === "received"
              ? confession.senderAnonymousName
              : `@${confession.recipientInstagramUsername}`}
          </strong>

          <p>
            {new Date(
              confession.createdAt
            ).toLocaleString()}
          </p>

          {tab === "received" && (
            <small>
              {confession.recipientAction}
            </small>
          )}

          {tab === "sent" && (
            <small>
              {confession.deliveryStatus}
            </small>
          )}
        </div>
      ))}
    </div>
  );
}
