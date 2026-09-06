import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../wavelength.css";
import "./ConfessionDetails.css";
import StaticAvatar, { hueFromString } from "../components/InstagramVerification/StaticAvatar.jsx";
import {
  getConfession,
  updateConfessionAction,
  markConfessionRead,
} from "../inbox";
import { getSocket, connectSocket } from "../socket";
import { publishConfessionPublicly } from "../publicPost.js";

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function ConfessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [confession, setConfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [publicPosting, setPublicPosting] = useState(false);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    loadConfession();

    markConfessionRead(id).catch((error) => {
    console.error("MARK CONFESSION READ ERROR:", error);
  });

  const socket = getSocket() || connectSocket();

  if (!socket) return;

    function handleConfessionUpdated(data) {
      if (data.confessionId !== id) return;

      setConfession((current) => {
        if (!current) return current;
        return {
          ...current,
          recipientAction: data.recipientAction,
          conversationId: data.conversationId,
        };
      });

      setConversationId(data.conversationId || null);
    }

    function handlePublicPostUpdated(data) {
      if (String(data.confessionId) !== String(id)) return;

      setConfession((current) => {
        if (!current) return current;
        return {
          ...current,
          visibility: "public",
          publicPosted: true,
          publicPostedAt: data.publicPostedAt,
          instagramPostId: data.instagramPostId,
        };
      });
    }

    socket.on("confession-updated", handleConfessionUpdated);
    socket.on("public-post-updated", handlePublicPostUpdated);

    return () => {
      socket.off("confession-updated", handleConfessionUpdated);
      socket.off("public-post-updated", handlePublicPostUpdated);
    };
  }, [id]);

  async function loadConfession() {
    try {
      setLoading(true);
      setError("");
      const response = await getConfession(id);
      setConfession(response.data);
      setConversationId(response.data.conversationId || null);
    } catch (error) {
      console.error("CONFESSION LOAD ERROR:", error);
      setError(error.message || "Unable to load confession.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action) {
    if (!confession) return;

    try {
      setActionLoading(true);
      setError("");
      const response = await updateConfessionAction(confession._id, action);
      setConfession(response.data);
      setConversationId(response.data.conversationId || null);
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to respond.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePublicPost() {
    if (!confession) return;

    try {
      setPublicPosting(true);
      setError("");
      const response = await publishConfessionPublicly(confession._id);
      setConfession(response.data);
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to share confession publicly.");
    } finally {
      setPublicPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="wl-details">
        <div className="wl-empty wl-fade-up">
          <div className="wl-eq" style={{ justifyContent: "center", marginBottom: 14 }}>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <p className="wl-mono">Loading confession…</p>
        </div>
      </div>
    );
  }

  if (error && !confession) {
    return (
      <div className="wl-details">
        <div className="wl-error-banner">{error}</div>
      </div>
    );
  }

  if (!confession) {
    return (
      <div className="wl-details">
        <div className="wl-empty">
          <p className="wl-display">Confession not found.</p>
        </div>
      </div>
    );
  }

  const isSender = confession.senderUser === user?._id;
  const isRecipient = confession.recipientUser === user?._id;

  return (
    <div className="wl-details">
      <button className="wl-details__back" onClick={() => navigate("/inbox")}>
        <BackIcon /> Inbox
      </button>

      <div className="wl-details__who wl-fade-up">
        <StaticAvatar size={40} hue={hueFromString(confession.senderAnonymousName)} />
        <div>
          <div className="wl-row__name">{confession.senderAnonymousName}</div>
          <div className="wl-mono" style={{ fontSize: 10.5, color: "var(--wl-text-faint)" }}>
            TO @{confession.recipientInstagramUsername}
          </div>
        </div>
      </div>

      {error && <div className="wl-error-banner">{error}</div>}

      {/* <div className="wl-paper-card wl-details__card wl-fade-up">
        <p>{confession.message}</p>
      </div> */}

      {confession.imageUrls?.map((url) => (
        <img key={url} src={url} alt="Confession" className="wl-details__image" />
      ))}

      <p className="wl-mono wl-details__timestamp">
        SENT {new Date(confession.createdAt).toLocaleString()}
      </p>

      {/* ========================= RECIPIENT VIEW ========================= */}
      {isRecipient && (
        <div className="wl-details__section wl-fade-up">
          <div className="wl-eyebrow">YOUR RESPONSE</div>

          {confession.recipientAction === "pending" && (
            <>
              <p className="wl-details__prompt">Curious who sent this?</p>
              <p className="wl-mono" style={{ fontSize: 10.5, color: "var(--wl-text-faint)", marginBottom: 12 }}>
  Choosing curious starts an anonymous chat.
</p>
              <div className="wl-details__actions">
                <button className="wl-btn wl-btn-primary" disabled={actionLoading} onClick={() => handleAction("curious")}>
                  {actionLoading ? "Updating..." : "👀 Know them"}
                </button>
                <button className="wl-btn wl-btn-ghost" disabled={actionLoading} onClick={() => handleAction("not_interested")}>
                  Not interested
                </button>
              </div>
            </>
          )}

          {confession.recipientAction === "curious" && (
            <>
              <span className="wl-tag wl-tag--curious">👀 You're curious to know them.</span>
              {conversationId && (
                <button className="wl-btn wl-btn-primary wl-btn-block" style={{ marginTop: 14 }} onClick={() => navigate(`/chat/${conversationId}`)}>
                  Open conversation
                </button>
              )}
            </>
          )}

          {confession.recipientAction === "not_interested" && (
            <span className="wl-tag wl-tag--not-interested">Not interested</span>
          )}

          {confession.publicConsent && !confession.publicPosted && (
            <div className="wl-details__public-card wl-fade-up">
              <p>They're okay sharing on Wit Confessions, if you're comfortable too 🤍</p>
              <button className="wl-btn wl-btn-outline" disabled={publicPosting} onClick={handlePublicPost}>
                {publicPosting ? "Sharing on Instagram..." : "Share on Instagram"}
              </button>
            </div>
          )}

          {confession.publicPosted && (
            <div className="wl-details__public-card wl-fade-up">
              <p>✨ This confession is now public. You both chose to share this moment.</p>
              <a href="https://www.instagram.com/wit_confessions.26/" target="_blank" rel="noopener noreferrer" className="wl-btn wl-btn-outline" style={{ textDecoration: "none" }}>
                View on Instagram
              </a>
            </div>
          )}
        </div>
      )}

      {/* ========================= SENDER VIEW ========================= */}
      {isSender && (
        <div className="wl-details__section wl-fade-up">
          <div className="wl-eyebrow">RECIPIENT RESPONSE</div>

          {confession.recipientAction === "pending" && (
  <>
    <span className="wl-tag wl-tag--waiting">⏳ They're taking time to decide.</span>
    <p className="wl-details__prompt">If they're curious, a chat opens here automatically.</p>
  </>
)}

          {confession.recipientAction === "curious" && (
            <>
              <span className="wl-tag wl-tag--curious">👀 They'd like to know who you are.</span>
              {conversationId && (
                <button className="wl-btn wl-btn-primary wl-btn-block" style={{ marginTop: 14 }} onClick={() => navigate(`/chat/${conversationId}`)}>
                  Continue conversation
                </button>
              )}
            </>
          )}

          {confession.recipientAction === "not_interested" && <span className="wl-tag wl-tag--not-interested">They've decided to leave it here for now.</span>}
        </div>
      )}
    </div>
  );
}