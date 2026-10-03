import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../models/User.js';

export function roleGuard(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'Access denied: insufficient role privileges',
        requiredRoles: allowedRoles,
        currentRole: user.role,
      });
      return;
    }

    next();
  };
}
