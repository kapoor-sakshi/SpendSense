"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    // Bypass for mock token in demo mode
    if (token === 'mock_token_for_demo') {
        req.userId = 'mock_user_id_123';
        return next();
    }
    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_demo';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
exports.authMiddleware = authMiddleware;
exports.default = exports.authMiddleware;
