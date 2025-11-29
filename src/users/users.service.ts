import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        password: hashedPassword,
        role: 'user', // Default role for new registrations
      },
    });
  }

  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if user exists
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get all employees under a specific owner
   */
  async getEmployees(ownerId: number) {
    return await this.prisma.user.findMany({
      where: { ownerId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Assign an employee to an owner
   */
  async assignEmployee(ownerId: number, employeeId: number) {
    // Verify owner exists
    const owner = await this.findOne(ownerId);
    
    // Verify employee exists
    const employee = await this.findOne(employeeId);

    // Prevent self-assignment
    if (ownerId === employeeId) {
      throw new ConflictException('Cannot assign yourself as an employee');
    }

    // Prevent circular relationships (employee cannot be an owner)
    if (employee.ownerId) {
      throw new ConflictException('User is already assigned to another owner');
    }

    // Update employee's ownerId
    return await this.prisma.user.update({
      where: { id: employeeId },
      data: { ownerId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Remove an employee from an owner (unassign)
   */
  async unassignEmployee(ownerId: number, employeeId: number): Promise<void> {
    const employee = await this.findOne(employeeId);

    if (employee.ownerId !== ownerId) {
      throw new ConflictException('User is not assigned to this owner');
    }

    await this.prisma.user.update({
      where: { id: employeeId },
      data: { ownerId: null },
    });
  }
}


