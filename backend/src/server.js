import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js'; // 1. Import your custom connection logic

// Load environment variables from .env
dotenv.config();

// 2. Fire up the Database Connection
// This will use the MONGO_URI from your .env file
connectDB();

const PORT = process.env.PORT || 5000;

// Start the engine
app.listen(PORT, () => {
  console.log(`¡Fuego! 🔥 Server running in development mode on port ${PORT}`);
});