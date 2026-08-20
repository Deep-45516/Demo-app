import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "../wavelength.css";
import "./Chat.css";
import StaticAvatar, { hueFromString } from "../components/StaticAvatar.jsx";

import { getMessages, sendMessage } from "../chat/chat.js";
import { requestReveal, respondToReveal } from "../reveal/reveal.js";
import { getSocket, connectSocket } from "../socket";
import RevealSection from "../chat/RevealSection.jsx";
import { publishConfessionPublicly } from "../publicPost.js";

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

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

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?._id;

  const scrollRef = useRef(null);

  useEffect(() => {
    loadMessages();

    const socket = getSocket() || connectSocket();
    if (!socket) return;

    function handleNewMessage(data) {
      const message = data.message;
      if (message.conversationId !== conversationId) return;

      setMessages((current) => {
        const alreadyExists = current.some((item) => item._id === message._id);
        if (alreadyExists) return current;

        setRemainingMessages((remaining) => (remaining === null ? remaining : Math.max(remaining - 1, 0)));
        return [...current, message];
      });
    }

    function handleRevealUpdated(data) {
      if (data.conversationId !== conversationId) return;

      console.log("🔥 REVEAL UPDATED:", data);
      setRevealStatus(data.status);

      if (data.status === "pending") {
        setRevealRequestedBy(data.requestedBy || null);
        return;
      }

      if (data.decision === "not_yet") {
        setRevealStatus("none");
        setRevealRequestedBy(null);
        setRevealNotice("🌱 They're not ready to reveal yet. You can keep talking anonymously.");
        return;
      }

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadMessages() {
    try {
      setLoading(true);
      setError("");

      const response = await getMessages(conversationId);
      setMessages(response.data.messages || []);
      setRemainingMessages(response.data.remainingMessages);
      setConversationSenderId(response.data.senderUser);
      setPublicConsent(response.data.publicConsent || false);
      setPublicPosted(response.data.publicPosted || false);
      setInstagramPostId(response.data.instagramPostId || null);

      if (response.data.revealStatus) setRevealStatus(response.data.revealStatus);
      if (response.data.revealRequestedBy) setRevealRequestedBy(response.data.revealRequestedBy);

      setRevealedIdentity(response.data.revealedIdentity || null);
      setAutoOpenIdentity(false);
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!text.trim()) return;

    try {
      setSending(true);
      setError("");

      const response = await sendMessage(conversationId, text);
      setMessages((current) => [...current, response.data.message]);
      setRemainingMessages(response.data.remainingMessages);
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
      const response = await publishConfessionPublicly(conversationId);
      setPublicPosted(true);
      setInstagramPostId(response.data?.instagramPostId || null);
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to share confession publicly.");
    }
  }

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
    return (
      <div className="wl-chat">
        <div className="wl-empty wl-fade-up">
          <div className="wl-eq" style={{ justifyContent: "center", marginBottom: 14 }}>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <p className="wl-mono">Loading chat…</p>
        </div>
      </div>
    );
  }

  const otherName = messages.find((m) => String(m.senderUser) !== String(userId))?.senderAnonymousName;

  return (
    <div className="wl-chat">
      <div className="wl-chat__header">
        <button className="wl-chat__back" onClick={() => window.history.back()}>
          <BackIcon />
        </button>
        <StaticAvatar size={34} hue={hueFromString(String(conversationSenderId))} />
        <div>
          <div className="wl-row__name">{otherName || "Anonymous"}</div>
          <div className="wl-mono" style={{ fontSize: 9.5, color: "var(--wl-text-faint)" }}>ANONYMOUS</div>
        </div>
      </div>

      {remainingMessages !== null && remainingMessages > 0 && (
        <div className="wl-limit">
          <div className="wl-limit__top">
            <span>SIGNAL BUDGET</span>
            <span>{remainingMessages} left</span>
          </div>
          <div className="wl-limit__track">
            <div className="wl-limit__fill" style={{ width: `${Math.min(100, (remainingMessages / 12) * 100)}%` }} />
          </div>
        </div>
      )}

      {error && <div className="wl-error-banner">{error}</div>}

      <div className="wl-chat__messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="wl-empty">
            <p className="wl-display">No messages yet.</p>
            <p className="wl-mono" style={{ fontSize: 11 }}>Say something — anonymously, for now.</p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = String(message.senderUser) === String(userId);
            return (
              <div key={message._id} className={`wl-bubble ${mine ? "wl-bubble--me" : "wl-bubble--them"}`}>
                {message.text}
                <span className="wl-bubble__time">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
      </div>

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

      {publicConsent && !publicPosted && String(userId) !== String(conversationSenderId) && (
        <div className="wl-chat__public-card wl-fade-up">
          <p>✨ You both agreed to make this confession public.</p>
          <button className="wl-btn wl-btn-outline" onClick={handlePublishPublicly}>Post on Instagram</button>
        </div>
      )}

      {publicPosted && (
        <div className="wl-chat__public-card wl-fade-up">
          <p>✨ This confession is now public on Instagram.</p>
          {instagramPostId && <small className="wl-mono">Post created successfully.</small>}
        </div>
      )}

      {remainingMessages === 0 ? (
        <div className="wl-chat__limit-reached">This conversation has reached its limit.</div>
      ) : (
        <form className="wl-chat__input-row" onSubmit={handleSend}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Send a signal…"
            disabled={sending}
          />
          <button type="submit" className="wl-chat__send" disabled={sending}>
            <SendIcon />
          </button>
        </form>
      )}
    </div>
  );
}