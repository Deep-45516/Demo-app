import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getConfession } from "../inbox";

export default function ConfessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [confession, setConfession] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadConfession();
  }, [id]);

  async function loadConfession() {
    try {
      setLoading(true);

      const response =
        await getConfession(id);

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

  if (loading) {
    return <p>Loading confession...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!confession) {
    return <p>Confession not found.</p>;
  }

  return (
    <div style={{ padding: 30 }}>
      <button onClick={() => navigate("/inbox")}>
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

      <p>
        Status: {confession.recipientAction}
      </p>
    </div>
  );
}