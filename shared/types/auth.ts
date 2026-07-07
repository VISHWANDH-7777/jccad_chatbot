export type UserRole = 'Guest' | 'Student' | 'Professional' | 'Employee' | 'Manager' | 'Administrator' | 'Super Administrator';

export type UserPermission =
  | 'chat:send'
  | 'chat:history'
  | 'image:analyze'
  | 'knowledge:read'
  | 'knowledge:upload'
  | 'knowledge:approve'
  | 'knowledge:delete'
  | 'knowledge:sync'
  | 'analytics:read'
  | 'system:config'
  | 'audit:read';

export interface RolePermissions {
  role: UserRole;
  inherits: UserRole[];
  permissions: UserPermission[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
