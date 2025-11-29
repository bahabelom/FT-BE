import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('expenses')
// @UseGuards(JwtAuthGuard) // Temporarily disabled
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Helper method to get user info (with defaults when auth is disabled)
  private getUserInfo(req: any) {
    if (req.user) {
      return {
        userId: req.user.sub || req.user.userId,
        role: req.user.role || Role.OWNER,
      };
    }
    // Default values when auth is disabled (for development)
    return {
      userId: 1, // Default to user ID 1
      role: Role.OWNER, // Default to OWNER role
    };
  }

  @Post()
  create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    const userInfo = this.getUserInfo(req);
    // Users can create expenses for themselves
    // Owners can optionally specify userId in body to create for employees
    const targetUserId = createExpenseDto.userId || userInfo.userId;
    // Remove userId from DTO before passing to service (it's not part of expense data)
    const { userId, ...expenseData } = createExpenseDto;
    return this.expensesService.create(
      userInfo.userId,
      userInfo.role,
      expenseData as CreateExpenseDto,
      targetUserId,
    );
  }

  @Get()
  findAll(@Request() req, @Query() query: ExpenseQueryDto) {
    const userInfo = this.getUserInfo(req);
    return this.expensesService.findAll(userInfo.userId, userInfo.role, query);
  }

  @Get('statistics')
  getStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userInfo = this.getUserInfo(req);
    return this.expensesService.getStatistics(userInfo.userId, userInfo.role, startDate, endDate);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userInfo = this.getUserInfo(req);
    return this.expensesService.findOne(id, userInfo.userId, userInfo.role);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    const userInfo = this.getUserInfo(req);
    return this.expensesService.update(id, userInfo.userId, userInfo.role, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userInfo = this.getUserInfo(req);
    return this.expensesService.remove(id, userInfo.userId, userInfo.role);
  }
}

