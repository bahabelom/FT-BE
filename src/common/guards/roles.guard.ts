import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { hasRolePermission } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access (let other guards handle authorization)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (set by JWT guard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.role as Role;

    if (!userRole) {
      throw new ForbiddenException('User role not found in token. Please log in again.');
    }

    // Validate that the role is a valid Role enum value
    if (!Object.values(Role).includes(userRole)) {
      throw new ForbiddenException(`Invalid user role: ${userRole}. Please contact support.`);
    }

    // Check if user has any of the required roles
    const hasPermission = requiredRoles.some(role => 
      hasRolePermission(userRole, role)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. This endpoint requires one of these roles: ${requiredRoles.join(', ')}. Your current role: ${userRole}`
      );
    }

    return true;
  }
}
