import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./db/connectDB.js"
import { error } from "console";
import { createAdmins } from "./utils/createAdmin.js";
dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB()
    .then(
    async () => {
        await createAdmins();
        app.listen(PORT, (req, res) => {
            console.log(`port is http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MOngoDB COnnection Error", err);
        console.error(error.stack);
    })