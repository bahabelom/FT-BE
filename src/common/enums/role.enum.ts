/**
 * User roles for role-based access control (RBAC)
 * 
 * Hierarchy (from highest to lowest privilege):
 * - OWNER: Full system access, can manage everything including other owners
 * - ADMIN: Administrative access, can manage users and system settings
 * - USER: Standard user access, can manage own data
 */
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * Role hierarchy for permission checking
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.OWNER]: [Role.OWNER, Role.ADMIN, Role.USER],
  [Role.ADMIN]: [Role.ADMIN, Role.USER],
  [Role.USER]: [Role.USER],
};

/**
 * Check if a user's role has permission to access a resource
 * @param userRole - The user's current role
 * @param requiredRole - The minimum role required for access
 * @returns true if user has permission, false otherwise
 */
export function hasRolePermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole].includes(requiredRole);
}
