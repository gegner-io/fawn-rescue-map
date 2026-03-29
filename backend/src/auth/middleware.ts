import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './jwt';
import { Role } from './models';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}

export function authenticateRequest(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = verifyAccessToken(token);
    req.authUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
