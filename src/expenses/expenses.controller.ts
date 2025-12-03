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
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  private getUserId(req: any): number {
    return req.user?.userId || req.user?.sub;
  }

  @Get()
  async findAll(@Request() req, @Query() query: ExpenseQueryDto) {
    const userId = this.getUserId(req);
    const response = await this.expensesService.findAll(userId, query);
    console.log('GET /api/expenses response:', JSON.stringify(response, null, 2));
    return response;
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    return await this.expensesService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    const userId = this.getUserId(req);
    return await this.expensesService.create(userId, createExpenseDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    const userId = this.getUserId(req);
    return await this.expensesService.update(id, userId, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    await this.expensesService.remove(id, userId);
  }
}