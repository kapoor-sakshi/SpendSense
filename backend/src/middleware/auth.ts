import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default authMiddleware;
