import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./db/connectDB.js"
import { error } from "console";

dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB()
    .then(
    app.listen(PORT , (req,res) => {
    console.log(`port is http://localhost:${PORT}`)
})
    )
    .catch((err) => {
        console.error("MOngoDB COnnection Error", err);
    })