import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  user? : {
    userId: string;
    sessionId: string;
  };
}

export const requireAuth = (req : AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if(!authHeader?.startsWith('Bearer ')) {
    res.status(401)
        .json({
          status : 'error',
          message: 'Unauthorized: No token provied'
        });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Malformed token'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as {
      userId: string;
      sessionId: string;
    };

    // 3. Attach the decoded payload to the request
    req.user = decoded;
    next();

  } catch (error) {
    res.status(401)
        .json({ 
            status: 'error', 
            message: 'Unauthorized: Invalid or expired token' 
          });
  }
}