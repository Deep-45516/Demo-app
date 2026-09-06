const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 100,
    });

    console.log("✅DB Connected SUCCESSFULLY");
  } catch (error) {
    console.error(error.stack);
    console.error("❌ DB Not Connected", error);
    process.exit(1);
  }
};