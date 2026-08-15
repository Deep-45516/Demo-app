export default function RevealSection({
  userId,
  conversationSenderId,
  remainingMessages,
  revealStatus,
  revealRequestedBy,
  revealLoading,
  revealedIdentity,
  revealNotice,
  onRequestReveal,
  onRevealResponse,
}) {
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
        revealStatus !== "revealed" && (
          <p
            style={{
              marginBottom: 15,
            }}
          >
            ✨ You're getting close.
            Keep the conversation going.
          </p>
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
              marginBottom: 15,
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
            marginBottom: 15,
          }}
        >
          {String(
            revealRequestedBy
          ) === String(userId) ? (
            <p>
              👀 Reveal request sent.
              Waiting for their response.
            </p>
          ) : (
            <>
              <p>
                👀 They want to know
                who you are.
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
        <p
          style={{
            marginBottom: 15,
          }}
        >
          {revealNotice}
        </p>
      )}


      {/* =========================
          IDENTITY REVEALED
          ========================= */}

      {revealStatus ===
        "revealed" &&
        revealedIdentity && (
          <div
            style={{
              marginTop: 25,
              marginBottom: 25,
              padding: 25,
              borderRadius: 16,
              border: "1px solid #ddd",
              textAlign: "center",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                fontSize: 32,
                marginBottom: 8,
              }}
            >
              🎉
            </div>

            <h3
              style={{
                margin: "5px 0",
              }}
            >
              Identity Revealed
            </h3>

            <p
              style={{
                color: "#666",
                marginBottom: 20,
              }}
            >
              You both chose to reveal
              your identities.
            </p>

            {revealedIdentity.profilePicture ? (
              <img
                src={
                  revealedIdentity.profilePicture
                }
                alt="Instagram profile"
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: 12,
                }}
              />
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  margin:
                    "0 auto 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  fontSize: 35,
                  background: "#eee",
                }}
              >
                👤
              </div>
            )}

            <h3>
              {revealedIdentity.name ||
                revealedIdentity.username}
            </h3>

            <p>
              @{revealedIdentity.username}
            </p>

            <a
              href={`https://www.instagram.com/${revealedIdentity.username}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:
                  "inline-block",
                marginTop: 10,
                padding:
                  "10px 18px",
                borderRadius: 10,
                textDecoration:
                  "none",
                border:
                  "1px solid #ccc",
              }}
            >
              View Instagram
            </a>
          </div>
        )}
    </>
  );
}