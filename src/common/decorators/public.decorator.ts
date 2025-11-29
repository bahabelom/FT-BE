import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark endpoints as public (bypass authentication)
 * Use this decorator on endpoints that should be accessible without JWT authentication
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
