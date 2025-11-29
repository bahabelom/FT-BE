import { User } from '@prisma/client';
import { Role } from '../enums/role.enum';

/**
 * Extended User type that includes the role field
 * This is a temporary solution until Prisma client is regenerated
 */
export type UserWithRole = User & {
  role: Role;
};
