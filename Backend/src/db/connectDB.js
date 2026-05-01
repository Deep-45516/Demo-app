import mongoose from "mongoose";
const connectDB = async() =>
{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅DB Connected SUCCESSFULLY ")
    } catch (error) {
        console.error("❌ DB Not Connected",error);
        process.exit(1);
    }
}

export default connectDB;