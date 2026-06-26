import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import connectDB from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads if needed
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongooseConnectionStatus() });
});

function mongooseConnectionStatus() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1 ? 'connected' : 'simulated';
}

// Start Server & Connect DB
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 SpendSense AI Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Server failed to start:', err);
});
