import { Request, Response, NextFunction } from 'express';
import { UserRole, UserPermission, RolePermissions } from '../../../shared/types/auth';
import { User } from '../models/User';
import { getLocalDemoUserId } from '../services/chatPersistence';
import { isDatabaseReady } from './db';

// Explicit RBAC permission definition and hierarchy matrix
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'Guest': 0,
  'Student': 1,
  'Professional': 2,
  'Employee': 3,
  'Manager': 4,
  'Administrator': 5,
  'Super Administrator': 6
};

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'Guest',
    inherits: [],
    permissions: ['knowledge:read']
  },
  {
    role: 'Student',
    inherits: ['Guest'],
    permissions: ['chat:send', 'chat:history']
  },
  {
    role: 'Professional',
    inherits: ['Student'],
    permissions: ['image:analyze']
  },
  {
    role: 'Employee',
    inherits: ['Student'],
    permissions: ['knowledge:upload']
  },
  {
    role: 'Manager',
    inherits: ['Employee'],
    permissions: ['knowledge:approve', 'analytics:read']
  },
  {
    role: 'Administrator',
    inherits: ['Manager'],
    permissions: ['knowledge:delete', 'knowledge:sync', 'system:config']
  },
  {
    role: 'Super Administrator',
    inherits: ['Administrator'],
    permissions: ['audit:read']
  }
];

// Resolves a role's permissions recursively based on hierarchy
export const resolvePermissions = (role: UserRole): Set<UserPermission> => {
  const resolved = new Set<UserPermission>();
  const queue: UserRole[] = [role];
  const visited = new Set<UserRole>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const match = ROLE_PERMISSIONS.find((p) => p.role === current);
    if (match) {
      match.permissions.forEach((perm) => resolved.add(perm));
      match.inherits.forEach((parent) => queue.push(parent));
    }
  }

  return resolved;
};

// Express Custom Request Type Extender
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    permissions: Set<UserPermission>;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseReady()) {
      const localUserId = await getLocalDemoUserId();
      req.user = {
        id: localUserId,
        role: 'Super Administrator',
        permissions: resolvePermissions('Super Administrator')
      };
      return next();
    }

    let user = await User.findOne({ email: 'demo@jccad.com' });
    if (!user) {
      user = await User.create({
        email: 'demo@jccad.com',
        name: 'Demo Admin User',
        role: 'Super Administrator',
        passwordHash: 'dummy_hash_not_used',
        isEmailVerified: true
      });
    }
    req.user = {
      id: user._id.toString(),
      role: user.role,
      permissions: resolvePermissions(user.role)
    };
    next();
  } catch (err: any) {
    try {
      const localUserId = await getLocalDemoUserId();
      req.user = {
        id: localUserId,
        role: 'Super Administrator',
        permissions: resolvePermissions('Super Administrator')
      };
      next();
    } catch (fallbackErr) {
      next(err);
    }
  }
};

export const requirePermission = (permission: UserPermission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Permission checks are disabled for the demo; always allow
    next();
  };
};

export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Role checks are disabled for the demo; always allow
    next();
  };
};
