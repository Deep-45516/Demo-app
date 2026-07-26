import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getConfession } from "../inbox";
import { respondToConfession } from "../confessionActions";

export default function ConfessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [confession, setConfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Current logged-in user
  const storedUser = localStorage.getItem("user");
  const user = storedUser
    ? JSON.parse(storedUser)
    : null;

  useEffect(() => {
    loadConfession();
  }, [id]);

  async function loadConfession() {
    try {
      setLoading(true);

      const response = await getConfession(id);

      setConfession(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to load confession."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    try {
      setActionLoading(true);
      setError("");

      const response =
        await respondToConfession(
          confession._id,
          action
        );

      // Backend returns updated confession
      setConfession(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Unable to respond."
      );
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

  const isSender =
    confession.senderUser === user?._id;

  const isRecipient =
    confession.recipientUser === user?._id;

  return (
    <div style={{ padding: 30 }}>
      <button
        onClick={() => navigate("/inbox")}
      >
        ← Back to Inbox
      </button>

      <h2>Confession</h2>

      <p>
        From:{" "}
        <strong>
          {confession.senderAnonymousName}
        </strong>
      </p>

      <p>
        To:{" "}
        <strong>
          @{confession.recipientInstagramUsername}
        </strong>
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

      <p>
        Sent:{" "}
        {new Date(
          confession.createdAt
        ).toLocaleString()}
      </p>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {/* RECIPIENT VIEW */}
      {isRecipient && (
        <div
          style={{
            marginTop: 30,
            borderTop: "1px solid #ccc",
            paddingTop: 20,
          }}
        >
          <h3>Your Response</h3>

          {confession.recipientAction ===
            "pending" && (
            <>
              <p>
                Are you curious about who sent
                this confession?
              </p>

              <button
                disabled={actionLoading}
                onClick={() =>
                  handleAction("curious")
                }
              >
                👀 Curious
              </button>

              <button
                disabled={actionLoading}
                onClick={() =>
                  handleAction(
                    "not_interested"
                  )
                }
                style={{ marginLeft: 10 }}
              >
                Not Interested
              </button>
            </>
          )}

          {confession.recipientAction ===
            "curious" && (
            <p>
              👀 You said you're curious.
            </p>
          )}

          {confession.recipientAction ===
            "not_interested" && (
            <p>
              You're not interested in this
              confession.
            </p>
          )}
        </div>
      )}

      {/* SENDER VIEW */}
      {isSender && (
        <div
          style={{
            marginTop: 30,
            borderTop: "1px solid #ccc",
            paddingTop: 20,
          }}
        >
          <h3>Recipient Response</h3>

          {confession.recipientAction ===
            "pending" && (
            <p>
              ⏳ Waiting for their response.
            </p>
          )}

          {confession.recipientAction ===
            "curious" && (
            <p>
              👀 They're curious about you.
            </p>
          )}

          {confession.recipientAction ===
            "not_interested" && (
            <p>
              They aren't interested.
            </p>
          )}
        </div>
      )}
    </div>
  );
}