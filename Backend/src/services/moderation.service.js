// Zero-cost local moderation.
// This runs completely on our backend.
// No external API is required.

const BANNED_WORDS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "idiot",
  "stupid",
];

const BLOCKED_PATTERNS = [
  {
    type: "email",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },

  {
    type: "instagram",
    regex:
      /(?:instagram\.com\/|insta(?:gram)?\s*[:\-]?\s*|@)[a-zA-Z0-9._]{2,30}/i,
  },

  {
    type: "url",
    regex:
      /\b(?:https?:\/\/|www\.)[^\s]+/i,
  },

  {
    type: "phone",
    regex:
      /(?:\+91[\s-]?)?[6-9]\d{9}\b/,
  },
];

export function moderateMessage(
  text,
  blockedUsernames = []
) {
  const normalizedText = text
    .toLowerCase()
    .trim();

  if (!normalizedText) {
    return {
      allowed: false,
      reason: "Message cannot be empty.",
    };
  }

  for (const word of BANNED_WORDS) {
    const wordRegex = new RegExp(
      `\\b${word}\\b`,
      "i"
    );

    if (wordRegex.test(normalizedText)) {
      return {
        allowed: false,
        reason:
          "This message contains language that is not allowed.",
      };
    }
  }

  for (const username of blockedUsernames) {
    if (!username) continue;

    const normalizedUsername =
      username.toLowerCase().trim();

    if (
      normalizedUsername &&
      normalizedText.includes(
        normalizedUsername
      )
    ) {
      return {
        allowed: false,
        reason:
          "Let's keep identities anonymous for now. 👀",
      };
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.regex.test(text)) {
      return {
        allowed: false,
        reason:
          "Sharing personal contact or social media information is not allowed.",
      };
    }
  }

  return {
    allowed: true,
    reason: null,
  };
}