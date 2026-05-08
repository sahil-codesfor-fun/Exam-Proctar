import mongoose from 'mongoose';

export const connectDB = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log(`⏳ Connecting to MongoDB (Retries left: ${retries})...`);
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return; // Exit loop on success
    } catch (error) {
      console.error(`❌ MongoDB Connection Failed: ${error.message}`);
      retries -= 1;
      if (retries === 0) {
        console.error("❌ Max retries reached. Exiting application.");
        process.exit(1);
      }
      console.log(`⏳ Waiting 5 seconds before retrying...`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};