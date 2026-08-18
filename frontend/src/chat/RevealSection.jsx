import { useEffect, useState } from "react";
import "./RevealSection.css";
import "../theme.css"
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
      {/* =========================
          A "not yet" notice from the other side
          (kept from the original prop, previously unused in the UI)
          ========================= */}
      {revealNotice && <div className="rs-notice">{revealNotice}</div>}

      {/* =========================
          SENDER ATTENTION
          ========================= */}
      {isSender &&
        remainingMessages !== null &&
        remainingMessages <= 5 &&
        remainingMessages > 0 &&
        revealStatus === "revealed" && (
          <div className="rs-banner cv-fade-up">
            <strong>They chose to reveal themselves.</strong>
            <p>
              You started this conversation anonymously. They chose to take
              that next step with you.
            </p>
          </div>
        )}

      {/* =========================
          RECIPIENT REVEAL REQUEST
          ========================= */}
      {!isSender &&
        remainingMessages !== null &&
        remainingMessages <= 5 &&
        revealStatus === "none" && (
          <div className="rs-ask-row">
            <button
              className="cv-btn cv-btn-outline"
              onClick={onRequestReveal}
              disabled={revealLoading}
            >
              {revealLoading ? "Sending..." : "Ask to reveal identity"}
            </button>
          </div>
        )}

      {/* =========================
          PENDING REVEAL
          ========================= */}
      {revealStatus === "pending" && (
        <div className="rs-pending cv-fade-up">
          {String(revealRequestedBy) === String(userId) ? (
            <>
              <strong>
                <span className="cv-pulse-dot" /> Reveal request sent
              </strong>
              <p>Waiting for them to decide.</p>
            </>
          ) : (
            <>
              <strong>They want to know who you are.</strong>
              <p>You can reveal your identity when you're ready.</p>
              <button
                className="cv-btn cv-btn-primary"
                onClick={() => onRevealResponse("reveal")}
                disabled={revealLoading}
              >
                Reveal identity
              </button>
              <button
                className="cv-btn cv-btn-ghost"
                onClick={() => onRevealResponse("not_yet")}
                disabled={revealLoading}
              >
                Not yet
              </button>
            </>
          )}
        </div>
      )}

      {/* =========================
          IDENTITY REVEALED
          ========================= */}
      {revealStatus === "revealed" && (
        <div className="rs-revealed cv-fade-up">
          {isSender ? (
            <>
              <div className="rs-icon">🔓</div>
              <strong>They know it's you now.</strong>
              <p>
                <strong>@{revealedIdentity?.username || "them"}</strong> knows
                who was behind the message.
              </p>
              <p>You wondered what they'd think once they knew. Now they do.</p>
              <p>Keep the conversation going and see where it goes.</p>
              <button
                className="cv-btn cv-btn-primary"
                onClick={() =>
                  window.open(
                    `https://www.instagram.com/direct/t/${revealedIdentity?.username}/`,
                    "_blank"
                  )
                }
              >
                Continue on Instagram
              </button>
              <button
                className="cv-btn cv-btn-ghost rs-secondary-btn"
                onClick={() => setShowIdentity(true)}
              >
                See their identity
              </button>
            </>
          ) : (
            <>
              <div className="rs-icon">🔓</div>
              <strong>Identity revealed</strong>
              <p>You both chose to take this conversation beyond anonymity.</p>
              <button
                className="cv-btn cv-btn-primary"
                onClick={() => setShowIdentity(true)}
              >
                See identity
              </button>
            </>
          )}
        </div>
      )}

      {/* =========================
          IDENTITY POPUP — the vault opens here
          ========================= */}
      {showIdentity && revealedIdentity && (
        <div className="rs-modal-overlay" onClick={() => setShowIdentity(false)}>
          <div className="rs-modal cv-fade-up" onClick={(event) => event.stopPropagation()}>
            <div className="rs-icon">🔓</div>
            <h2>Identity revealed</h2>
            <p className="rs-sub">The person behind the anonymous conversation.</p>

            <div className="cv-vault cv-unlock">
              <div className="cv-vault-photo">
                {revealedIdentity.profilePicture ? (
                  <img src={revealedIdentity.profilePicture} alt="Instagram profile" />
                ) : (
                  <div className="cv-vault-placeholder">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F1EFEA" strokeWidth="1.6">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="cv-vault-door cv-vault-door-l" />
              <div className="cv-vault-door cv-vault-door-r" />
              <div className="cv-vault-dial" />
            </div>

            <h3>{revealedIdentity.name || revealedIdentity.username}</h3>
            <p className="rs-handle">@{revealedIdentity.username}</p>

            <a
              href={`https://www.instagram.com/${revealedIdentity.username}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="cv-btn cv-btn-outline"
              style={{ textDecoration: "none" }}
            >
              View on Instagram
            </a>
            <button className="cv-btn cv-btn-ghost" onClick={() => setShowIdentity(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}