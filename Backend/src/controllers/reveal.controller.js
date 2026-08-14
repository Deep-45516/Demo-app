import {
  requestReveal,
  respondToReveal,
} from "../services/reveal.service.js";

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

    return res.status(200).json({
      success: true,
      data: result,
      message:
        decision === "reveal"
          ? "Identity revealed."
          : "Reveal request declined for now.",
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