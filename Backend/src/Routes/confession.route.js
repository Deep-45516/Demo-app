import { Router } from "express";
import Confession from "../models/confession.model.js";
import { generateImage } from "../utils/generateImage.js";

const router = Router();

// CREATE CONFESSION
router.post("/", async (req, res) => {
  try {
    const { to, from, message } = req.body;

     // 🔥 generate image
    const imageBuffer = await generateImage({ to, from, message });

    console.log("Image generated ✅");

    // 🔴 BASIC VALIDATION
    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    // 🔴 NEVER TRUST FRONTEND imageUrl so creat from backend 
const imagePath = await generateImage({ to, from, message });

const confession = await Confession.create({
  to,
  from,
  message,
  imageUrl: imagePath // temporary (local path)
});

    res.status(201).json({
      success: true,
      data: confession
    });

  } catch (err) {
    console.error("CREATE CONFESSION ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error saving confession"
    });
  }
});

export default router;