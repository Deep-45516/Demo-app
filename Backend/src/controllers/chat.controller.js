import {
  sendMessage,
} from "../services/chat.service.js";

export const createMessage =
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      const { text } = req.body;

      if (
        typeof text !== "string" ||
        !text.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message text is required.",
        });
      }

      if (text.length > 2000) {
        return res.status(400).json({
          success: false,
          message:
            "Message is too long.",
        });
      }

      const message =
        await sendMessage(
          conversationId,
          req.user.id,
          text
        );

      return res.status(201).json({
        success: true,
        data: message,
        message:
          "Message sent successfully.",
      });

    } catch (error) {
      console.error(
        "CREATE MESSAGE ERROR:",
        error
      );

      return res.status(
        error.statusCode || 500
      ).json({
        success: false,
        message:
          error.message ||
          "Unable to send message.",
      });
    }
  };