import { useEffect, useState } from "react";

import {
  getReceivedConfessions,
  getSentConfessions,
} from "../inbox";

export default function Inbox() {
  const [tab, setTab] = useState("received");

  const [received, setReceived] = useState([]);

  const [sent, setSent] = useState([]);

  useEffect(() => {
    loadInbox();
  }, []);

  async function loadInbox() {
    const r = await getReceivedConfessions();
    const s = await getSentConfessions();

    setReceived(r.data || []);
    setSent(s.data || []);
  }

  const list =
    tab === "received" ? received : sent;

  return (
    <div>

      <h2>Inbox</h2>

      <button
        onClick={() =>
          setTab("received")
        }
      >
        Received
      </button>

      <button
        onClick={() =>
          setTab("sent")
        }
      >
        Sent
      </button>

      <hr />

      {list.map((c) => (
        <div
          key={c._id}
          style={{
            border: "1px solid gray",
            marginBottom: 20,
            padding: 15,
          }}
        >
          <p>

            <strong>
              {tab === "received"
                ? c.senderAnonymousName
                : c.recipientInstagramUsername}
            </strong>

          </p>

          <p>{c.message}</p>

          {c.imageUrls?.map((url) => (
            <img
              key={url}
              src={url}
              width={250}
            />
          ))}
        </div>
      ))}
    </div>
  );
}