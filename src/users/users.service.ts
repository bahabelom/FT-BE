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
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
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
    const ownerEmployees = await this.prisma.ownerEmployee.findMany({
      where: { ownerId },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ownerEmployees.map(oe => ({
      ...oe.employee,
      assignedAt: oe.createdAt,
    }));
  }

  /**
   * Assign an employee to an owner
   */
  async assignEmployee(ownerId: number, employeeId: number) {
    // Verify owner exists
    await this.findOne(ownerId);
    
    // Verify employee exists
    await this.findOne(employeeId);

    // Prevent self-assignment
    if (ownerId === employeeId) {
      throw new ConflictException('Cannot assign yourself as an employee');
    }

    // Check if relationship already exists
    const existing = await this.prisma.ownerEmployee.findUnique({
      where: {
        ownerId_employeeId: {
          ownerId,
          employeeId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Employee is already assigned to this owner');
    }

    // Create the relationship in junction table
    const ownerEmployee = await this.prisma.ownerEmployee.create({
      data: {
        ownerId,
        employeeId,
      },
      include: {
        employee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return {
      ...ownerEmployee.employee,
      assignedAt: ownerEmployee.createdAt,
    };
  }

  /**
   * Remove an employee from an owner (unassign)
   */
  async unassignEmployee(ownerId: number, employeeId: number): Promise<void> {
    const ownerEmployee = await this.prisma.ownerEmployee.findUnique({
      where: {
        ownerId_employeeId: {
          ownerId,
          employeeId,
        },
      },
    });

    if (!ownerEmployee) {
      throw new ConflictException('Employee is not assigned to this owner');
    }

    await this.prisma.ownerEmployee.delete({
      where: {
        id: ownerEmployee.id,
      },
    });
  }
}


