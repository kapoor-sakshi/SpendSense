import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ WARNING: MONGODB_URI is not set in env. The server will run in SIMULATION / MEMORY DB mode.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully.');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.warn('⚠️ WARNING: Failed to connect to database. Falling back to SIMULATION / MEMORY DB mode.');
    return false;
  }
};

export default connectDB;
