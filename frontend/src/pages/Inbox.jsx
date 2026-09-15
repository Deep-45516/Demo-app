import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../wavelength.css";
import "./inbox.css";
import StaticAvatar, { hueFromString } from "../components/InstagramVerification/StaticAvatar.jsx";

import { getInbox } from "../inbox";
import {
  getSocket,
  subscribeToNewConfession,
  unsubscribeFromNewConfession,
} from "../socket";

function StatusTag({ action }) {
  if (action === "curious") return <span className="wl-tag wl-tag--curious">👀 Curious</span>;
  if (action === "not_interested") return <span className="wl-tag wl-tag--not-interested">Not interested</span>;
  return <span className="wl-tag wl-tag--waiting">⏳ Waiting</span>;
}

export default function Inbox() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;
const userId = user?._id;
const socket = getSocket();
  
  useEffect(() => {
  loadInbox();

  async function handleNewConfession(data) {
    console.log("🔥 NEW CONFESSION EVENT");
    console.log(data);

    await loadInbox();
  }

  function handleNewMessage(data) {
  setReceived((current) => {
    const index = current.findIndex(
      (item) =>
        String(item._id) === String(data.confessionId)
    );

    if (index === -1) return current;

    const updated = {
      ...current[index],
      unreadFor: data.unreadFor,
      readAt: null,
      lastActivityAt: data.lastActivityAt,
    };

    const newList = [...current];
    newList.splice(index, 1);
    newList.unshift(updated);

    return newList;
  });

  setSent((current) => {
    const index = current.findIndex(
      (item) =>
        String(item._id) === String(data.confessionId)
    );

    if (index === -1) return current;

    const updated = {
      ...current[index],
      unreadFor: data.unreadFor,
      readAt: null,
      lastActivityAt: data.lastActivityAt,
    };

    const newList = [...current];
    newList.splice(index, 1);
    newList.unshift(updated);

    return newList;
  });
}

  subscribeToNewConfession(handleNewConfession);

  const socket = getSocket();

  if (socket) {
    socket.on("new-message", handleNewMessage);
  }

  return () => {
    unsubscribeFromNewConfession(handleNewConfession);

    if (socket) {
      socket.off("new-message", handleNewMessage);
    }
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

  const list = tab === "received" ? received : sent;

  if (loading) {
    return (
      <div className="wl-inbox">
        <div className="wl-empty wl-fade-up">
          <div className="wl-eq" style={{ justifyContent: "center", marginBottom: 14 }}>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <p className="wl-mono">Loading inbox…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wl-inbox">
        <div className="wl-error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="wl-inbox">
      {/* <div className="wl-eyebrow" style={{ marginBottom: 8 }}>INBOX</div>
      <h1 className="wl-display wl-inbox__heading">Every signal you've caught.</h1> */}

      <div className="wl-segment wl-inbox__segment">
        <button className={tab === "received" ? "active" : ""} 
        style={{ fontSize: 15 }}
        onClick={() => setTab("received")}>
          Received ({received.length})
        </button>
        <button className={tab === "sent" ? "active" : ""} style={{ fontSize: 15 }}onClick={() => setTab("sent")}>
          Sent ({sent.length})
        </button>
      </div>

      {list.length === 0 && (
        <div className="wl-empty wl-fade-up">
          <p className="wl-display">
            {tab === "received" ? "No signals yet." : "Nothing sent yet."}
          </p>
          <p className="wl-mono" style={{ fontSize: 11 }}>
            {tab === "received" ? "Someone out there might be listening." : "Send the first one from Confess."}
          </p>
        </div>
      )}

      <div className="wl-stagger">
        {list.map((confession) => {
          console.log("CONFESSION:", confession);
          const label =
            tab === "received"
              ? confession.senderAnonymousName
              : `@${confession.recipientInstagramUsername}`;
              console.log(confession.senderAnonymousName, "readAt:", confession.readAt);

          return (
            <div
              key={confession._id}
              className="wl-row wl-fade-up"
              onClick={() => navigate(`/confessions/${confession._id}`)}
            >
              {tab === "received" ? (
                <StaticAvatar size={44} hue={hueFromString(confession.senderAnonymousName)} />
              ) : (
                <StaticAvatar size={44} initial={confession.recipientInstagramUsername} />
              )}

              <div className="wl-row__meta">
                <div className="wl-row__top">
                  <span className="wl-row__name">
  {label}
  {String(confession.unreadFor) === String(userId) && (
  <span
    className="wl-unread-dot"
    style={{
      marginLeft: 6,
      verticalAlign: "middle",
    }}
  />
)}
</span>
                  <span className="wl-row__time wl-mono">
                    {new Date(confession.lastActivityAt || confession.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="wl-row__status">
                  <StatusTag action={confession.recipientAction} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}