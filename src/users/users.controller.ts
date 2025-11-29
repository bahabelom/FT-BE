import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@Controller('users')
// @UseGuards(RolesGuard) // Temporarily disabled
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'User profile retrieved successfully',
      user: req.user,
    };
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Roles(Role.OWNER)
  @Get('employees')
  getEmployees(@Request() req) {
    return this.usersService.getEmployees(req.user.sub);
  }

  @Roles(Role.OWNER)
  @Post('employees/:employeeId')
  @HttpCode(HttpStatus.OK)
  assignEmployee(
    @Request() req,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return this.usersService.assignEmployee(req.user.sub, employeeId);
  }

  @Roles(Role.OWNER)
  @Delete('employees/:employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unassignEmployee(
    @Request() req,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return this.usersService.unassignEmployee(req.user.sub, employeeId);
  }
}


