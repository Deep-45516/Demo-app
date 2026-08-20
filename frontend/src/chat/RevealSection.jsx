import { useEffect, useState } from "react";
import "./RevealSection.css";

export default function RevealSection({
  userId,
  conversationSenderId,
  remainingMessages,
  revealStatus,
  revealRequestedBy,
  revealLoading,
  revealedIdentity,
  revealNotice,
  autoOpenIdentity,
  onRequestReveal,
  onRevealResponse,
}) {
  const [showIdentity, setShowIdentity] = useState(false);

  useEffect(() => {
    if (autoOpenIdentity && revealedIdentity) {
      setShowIdentity(true);
    }
  }, [autoOpenIdentity, revealedIdentity]);

  const isSender = String(userId) === String(conversationSenderId);

  return (
    <>
      {revealNotice && <div className="rs-notice">{revealNotice}</div>}

      {/* SENDER ATTENTION */}
      {isSender &&
        remainingMessages !== null &&
        remainingMessages <= 5 &&
        remainingMessages > 0 &&
        revealStatus === "revealed" && (
          <div className="rs-banner wl-fade-up">
            <strong>They chose to reveal themselves.</strong>
            <p>You started this conversation anonymously. They chose to take that next step with you.</p>
          </div>
        )}

      {/* RECIPIENT REVEAL REQUEST */}
      {!isSender &&
        remainingMessages !== null &&
        remainingMessages <= 5 &&
        revealStatus === "none" && (
          <div className="rs-ask-row">
            <button className="wl-btn wl-btn-outline" onClick={onRequestReveal} disabled={revealLoading}>
              {revealLoading ? "Sending..." : "Ask to reveal identity"}
            </button>
          </div>
        )}

      {/* PENDING */}
      {revealStatus === "pending" && (
        <div className="rs-pending wl-fade-up">
          {String(revealRequestedBy) === String(userId) ? (
            <>
              <strong><span className="wl-pulse-dot" /> Reveal request sent</strong>
              <p>Waiting for them to decide.</p>
            </>
          ) : (
            <>
              <strong>They want to know who you are.</strong>
              <p>You can reveal your identity when you're ready.</p>
              <button className="wl-btn wl-btn-primary" onClick={() => onRevealResponse("reveal")} disabled={revealLoading}>
                Reveal identity
              </button>
              <button className="wl-btn wl-btn-ghost" onClick={() => onRevealResponse("not_yet")} disabled={revealLoading}>
                Not yet
              </button>
            </>
          )}
        </div>
      )}

      {/* REVEALED */}
      {revealStatus === "revealed" && (
        <div className="rs-revealed wl-fade-up">
          {isSender ? (
            <>
              <div className="rs-icon">📡</div>
              <strong>They know it's you now.</strong>
              <p><strong>@{revealedIdentity?.username || "them"}</strong> knows who was behind the message.</p>
              <p>You wondered what they'd think once they knew. Now they do.</p>
              <button
                className="wl-btn wl-btn-primary"
                onClick={() => window.open(`https://www.instagram.com/direct/t/${revealedIdentity?.username}/`, "_blank")}
              >
                Continue on Instagram
              </button>
              <button className="wl-btn wl-btn-ghost rs-secondary-btn" onClick={() => setShowIdentity(true)}>
                See their identity
              </button>
            </>
          ) : (
            <>
              <div className="rs-icon">📡</div>
              <strong>Identity revealed</strong>
              <p>You both chose to take this conversation beyond anonymity.</p>
              <button className="wl-btn wl-btn-primary" onClick={() => setShowIdentity(true)}>
                See identity
              </button>
            </>
          )}
        </div>
      )}

      {/* IDENTITY POPUP */}
      {showIdentity && revealedIdentity && (
        <div className="rs-modal-overlay" onClick={() => setShowIdentity(false)}>
          <div className="rs-modal wl-fade-up" onClick={(event) => event.stopPropagation()}>
            <div className="rs-icon">📡</div>
            <h2 className="wl-display">Tuned in.</h2>
            <p className="rs-sub">The person behind the anonymous conversation.</p>

            <div className="rs-photo">
              <div className="rs-photo-layer">
                {revealedIdentity.profilePicture ? (
                  <img src={revealedIdentity.profilePicture} alt="Instagram profile" />
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F1EFEA" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                )}
              </div>
              <svg className="rs-static-layer" viewBox="0 0 104 104">
                <rect width="104" height="104" filter="url(#wl-static-filter)" />
              </svg>
            </div>

            <h3 className="wl-display rs-name">{revealedIdentity.name || revealedIdentity.username}</h3>
            <p className="rs-handle wl-mono">@{revealedIdentity.username}</p>

            <a
              href={`https://www.instagram.com/${revealedIdentity.username}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="wl-btn wl-btn-outline"
              style={{ textDecoration: "none" }}
            >
              View on Instagram
            </a>
            <button className="wl-btn wl-btn-ghost" onClick={() => setShowIdentity(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}