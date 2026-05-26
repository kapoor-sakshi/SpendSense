"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static uploads if needed
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api', api_1.default);
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
    await (0, db_1.default)();
    app.listen(PORT, () => {
        console.log(`🚀 SpendSense AI Backend running on http://localhost:${PORT}`);
    });
};
startServer().catch(err => {
    console.error('Server failed to start:', err);
});
