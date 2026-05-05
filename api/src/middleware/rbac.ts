import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }

    next()
  }
}

export const requireAdmin = requireRole('ADMIN')
export const requireProvider = requireRole('ADMIN', 'PROVIDER')
export const requireStaff = requireRole('ADMIN', 'PROVIDER', 'STAFF')
export const requireClient = requireRole('ADMIN', 'PROVIDER', 'STAFF', 'CLIENT')
