import {
  requestReveal,
  respondToReveal,
} from "../services/reveal.service.js";
import {
  notifyRevealUpdated,
} from "../socket/reveal.socket.js";
import User from "../models/user.model.js";

export async function createRevealRequest(
  req,
  res
) {
  try {
    const result =
      await requestReveal(
        req.params.conversationId,
        req.user.id
      );
      notifyRevealUpdated(
  result.requestedFrom,
  {
    conversationId:
      req.params.conversationId,
    status: "pending",
    requestedBy:
      req.user.id,
    expiresAt:
      result.expiresAt,
  }
);

    return res.status(201).json({
      success: true,
      data: result,
      message:
        "Reveal request sent.",
    });
  } catch (error) {
    console.error(
      "CREATE REVEAL REQUEST ERROR:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Unable to request reveal.",
    });
  }
}

export async function respondReveal(
  req,
  res
) {
  try {
    const { decision } = req.body;

    const result =
      await respondToReveal(
        req.params.conversationId,
        req.user.id,
        decision
      );

    // =========================
    // NOT YET
    // =========================

    if (
      result.decision ===
      "not_yet"
    ) {
      notifyRevealUpdated(
        result.requestedBy,
        {
          conversationId:
            req.params.conversationId,

          status: "none",

          decision: "not_yet",
        }
      );

      return res.status(200).json({
        success: true,
        data: result,
        message:
          "Reveal request declined for now.",
      });
    }


    // =========================
    // REVEALED
    // =========================

// =========================
// REVEALED
// =========================

const users = await User.find({
  _id: {
    $in: [
      result.requestedBy,
      req.user.id,
    ],
  },
}).select(
  "instagramUsername instagramName profilePicture"
);

const requester =
  users.find(
    (user) =>
      String(user._id) ===
      String(result.requestedBy)
  );

const responder =
  users.find(
    (user) =>
      String(user._id) ===
      String(req.user.id)
  );

if (!requester || !responder) {
  throw new Error(
    "Unable to load identity information."
  );
}

const requesterData = {
  username:
    requester.instagramUsername,
  name:
    requester.instagramName,
  profilePicture:
    requester.profilePicture,
};

const responderData = {
  username:
    responder.instagramUsername,
  name:
    responder.instagramName,
  profilePicture:
    responder.profilePicture,
};


// Requester receives responder's identity
notifyRevealUpdated(
  result.requestedBy,
  {
    conversationId:
      req.params.conversationId,

    status: "revealed",

    decision: "reveal",

    identity:
      responderData,
  }
);


// Responder receives requester's identity
notifyRevealUpdated(
  req.user.id,
  {
    conversationId:
      req.params.conversationId,

    status: "revealed",

    decision: "reveal",

    identity:
      requesterData,
  }
);


return res.status(200).json({
  success: true,

  data: {
    ...result,

    identity:
      requesterData,
  },

  message:
    "Identity revealed.",
});

  } catch (error) {
    console.error(
      "RESPOND REVEAL ERROR:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Unable to respond to reveal request.",
    });
  }
}