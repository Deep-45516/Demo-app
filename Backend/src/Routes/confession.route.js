import { Router } from "express";
import Confession from "../models/confession.model.js";
import { generateImage } from "../utils/generateImage.js";
import { uploadImage } from "../utils/uploadToFirebase.js";
const router = Router();

// CREATE CONFESSION
router.post("/", async (req, res) => {
  try {
    const { to, from, message } = req.body;

     // 🔥 generate image
   
    // 🔴 BASIC VALIDATION
    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }
    // 1. generate image locally
    // 🔴 NEVER TRUST FRONTEND imageUrl so creat from backend
    //Hey backend, create image using this data 
  const imagePath = await generateImage({ to, from, message });

  // 2. upload to firebase
    const imageUrl = await uploadImage(imagePath, to);

    console.log("Uploaded:", imageUrl);

  // 3. save in DB
const confession = await Confession.create({
  to,
  from,
  message,
  imageUrl: imageUrl // temporary (local path)
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