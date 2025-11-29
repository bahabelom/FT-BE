import { Role } from '../../common/enums/role.enum';

/**
 * DTO for user data in JWT payload and auth responses
 */
export class UserPayloadDto {
  id: number;
  email: string;
  name: string;
  role: Role;
}
