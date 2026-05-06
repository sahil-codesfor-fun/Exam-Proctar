import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`¡Perfecto! MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`¡Ay Dios mío! Error: ${error.message}`);
    process.exit(1);
  }
};