import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  email?: string;
  name?: string;
  role?: Role;
}
