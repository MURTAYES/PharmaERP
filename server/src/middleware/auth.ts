import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret) as AuthUser;
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }
}

export const authenticate = authMiddleware;
