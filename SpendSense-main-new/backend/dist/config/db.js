"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn('⚠️ WARNING: MONGODB_URI is not set in env. The server will run in SIMULATION / MEMORY DB mode.');
        return false;
    }
    try {
        await mongoose_1.default.connect(uri);
        console.log('✅ MongoDB connected successfully.');
        return true;
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.warn('⚠️ WARNING: Failed to connect to database. Falling back to SIMULATION / MEMORY DB mode.');
        return false;
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
