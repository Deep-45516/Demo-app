import {
  useEffect,
  useState,
} from "react";

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
  const [showIdentity, setShowIdentity] =
    useState(false);

    useEffect(() => {
  if (
    autoOpenIdentity &&
    revealedIdentity
  ) {
    setShowIdentity(true);
  }
}, [
  autoOpenIdentity,
  revealedIdentity,
]);

  const isSender =
    String(userId) ===
    String(conversationSenderId);

  return (
    <>
      {/* =========================
          SENDER ATTENTION
          ========================= */}

      {isSender &&
        remainingMessages !== null &&
        remainingMessages <= 5 &&
        remainingMessages > 0 &&
        revealStatus === "revealed" && (
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              borderRadius: 12,
              background: "#f8f8f8",
              border: "1px solid #e5e5e5",
            }}
          >
            <strong>
  🎉 They chose to reveal themselves.
</strong>

<p
  style={{
    margin: "6px 0 0",
  }}
>
  You started this conversation
  anonymously. They chose to
  take that next step with you.
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
          <div
            style={{
              marginBottom: 20,
            }}
          >
            <button
              onClick={
                onRequestReveal
              }
              disabled={
                revealLoading
              }
            >
              {revealLoading
                ? "Sending..."
                : "✨ Ask to Reveal Identity"}
            </button>
          </div>
        )}


      {/* =========================
          PENDING REVEAL
          ========================= */}

      {revealStatus === "pending" && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            background: "#f8f8f8",
            border: "1px solid #e5e5e5",
          }}
        >
          {String(
            revealRequestedBy
          ) === String(userId) ? (
            <>
              <strong>
                👀 Reveal request sent
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 0",
                }}
              >
                Waiting for them
                to decide.
              </p>
            </>
          ) : (
            <>
              <strong>
                👀 They want to know
                who you are.
              </strong>

              <p
                style={{
                  margin:
                    "6px 0 14px",
                }}
              >
                You can reveal your
                identity when you're
                ready.
              </p>

              <button
                onClick={() =>
                  onRevealResponse(
                    "reveal"
                  )
                }
                disabled={
                  revealLoading
                }
              >
                ✨ Reveal Identity
              </button>

              <button
                onClick={() =>
                  onRevealResponse(
                    "not_yet"
                  )
                }
                disabled={
                  revealLoading
                }
                style={{
                  marginLeft: 10,
                }}
              >
                Not Yet
              </button>
            </>
          )}
        </div>
      )}


      {/* =========================
          NOT YET NOTICE
          ========================= */}

      {revealNotice && (
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 12,
            background: "#fafafa",
            border:
              "1px solid #e5e5e5",
          }}
        >
          {revealNotice}
        </div>
      )}


      {/* =========================
          IDENTITY REVEALED
          ========================= */}

      {revealStatus ===
        "revealed" && (
          <div
            style={{
              marginBottom: 20,
              padding: 18,
              borderRadius: 14,
              border:
                "1px solid #e5e5e5",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 28,
                marginBottom: 6,
              }}
            >
              🎉
            </div>

            <strong>
              Identity revealed
            </strong>

            <p
              style={{
                margin:
                  "6px 0 14px",
                color: "#666",
              }}
            >
              You both chose to take
    this conversation beyond
    anonymity.
            </p>

            <button
              onClick={() =>
                setShowIdentity(true)
              }
            >
              👀 See Identity
            </button>
          </div>
        )}


      {/* =========================
          IDENTITY POPUP
          ========================= */}

      {showIdentity &&
        revealedIdentity && (
          <div
            onClick={() =>
              setShowIdentity(false)
            }
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0, 0, 0, 0.55)",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              style={{
                width: "100%",
                maxWidth: 380,
                background:
                  "#ffffff",
                borderRadius: 22,
                padding: 28,
                textAlign: "center",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 8,
                }}
              >
                ✨
              </div>

              <h2
                style={{
                  margin:
                    "0 0 6px",
                }}
              >
                Identity Revealed
              </h2>

              <p
                style={{
                  margin:
                    "0 0 22px",
                  color: "#666",
                }}
              >
                The person behind the
                anonymous conversation.
              </p>


              {/* Profile picture */}

              {revealedIdentity.profilePicture ? (
                <img
                  src={
                    revealedIdentity.profilePicture
                  }
                  alt="Instagram profile"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius:
                      "50%",
                    objectFit:
                      "cover",
                    marginBottom: 14,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius:
                      "50%",
                    margin:
                      "0 auto 14px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: 42,
                    background:
                      "#f1f1f1",
                  }}
                >
                  👤
                </div>
              )}


              <h3
                style={{
                  margin:
                    "4px 0",
                }}
              >
                {revealedIdentity.name ||
                  revealedIdentity.username}
              </h3>

              <p
                style={{
                  margin:
                    "4px 0 20px",
                  color: "#666",
                }}
              >
                @
                {
                  revealedIdentity.username
                }
              </p>


              <a
                href={`https://www.instagram.com/${revealedIdentity.username}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:
                    "block",
                  padding:
                    "12px 18px",
                  borderRadius: 12,
                  textDecoration:
                    "none",
                  border:
                    "1px solid #ddd",
                  marginBottom: 10,
                }}
              >
                View Instagram
              </a>

              <button
                onClick={() =>
                  setShowIdentity(
                    false
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "10px",
                  border: "none",
                  background:
                    "transparent",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
    </>
  );
}