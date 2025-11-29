import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('expenses')
// @UseGuards(JwtAuthGuard) // Temporarily disabled
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Helper to get user ID (with default when auth disabled)
  private getUserId(req: any): number {
    if (req.user) {
      return req.user.sub || req.user.userId;
    }
    return 1; // Default user ID for development
  }

  /**
   * GET /expenses - Get all expenses with optional period filter
   */
  @Get()
  async findAll(@Request() req, @Query() query: ExpenseQueryDto) {
    const userId = this.getUserId(req);
    const data = await this.expensesService.findAll(userId, query);
    // Return data directly - interceptor will wrap it
    return data;
  }

  /**
   * GET /expenses/:id - Get single expense
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    const data = await this.expensesService.findOne(id, userId);
    // Return data directly - interceptor will wrap it
    return data;
  }

  /**
   * POST /expenses - Create new expense
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    const userId = this.getUserId(req);
    const data = await this.expensesService.create(userId, createExpenseDto);
    // Return data directly - interceptor will wrap it
    return data;
  }

  /**
   * PUT /expenses/:id - Update expense
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    const userId = this.getUserId(req);
    const data = await this.expensesService.update(id, userId, updateExpenseDto);
    // Return data directly - interceptor will wrap it
    return data;
  }

  /**
   * DELETE /expenses/:id - Delete expense
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    const data = await this.expensesService.remove(id, userId);
    // Return data directly - interceptor will wrap it
    return data;
  }
}
