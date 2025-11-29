import { Role } from '../../common/enums/role.enum';

/**
 * DTO for JWT token payload
 */
export class JwtPayloadDto {
  email: string;
  sub: number; // user ID
  name: string;
  role: Role;
  type: 'access' | 'refresh';
}
