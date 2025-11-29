import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for accessing an endpoint
 * 
 * @param roles - Array of roles that can access this endpoint
 * 
 * @example
 * ```typescript
 * @Roles(Role.ADMIN, Role.OWNER)
 * @Get('admin-only')
 * adminOnlyEndpoint() {
 *   return 'Only admins and owners can access this';
 * }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
