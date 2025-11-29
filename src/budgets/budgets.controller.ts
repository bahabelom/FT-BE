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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /**
   * GET /budget - Get current budget (optionally filtered by period)
   */
  @Get()
  async findOne(@Request() req, @Query('period') period?: string) {
    const userId = req.user.sub || req.user.userId;
    const data = await this.budgetsService.findOne(userId, period);
    return { success: true, data };
  }

  /**
   * POST /budget - Create or update budget
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    const userId = req.user.sub || req.user.userId;
    const data = await this.budgetsService.createOrUpdate(userId, createBudgetDto);
    return { success: true, data };
  }

  /**
   * PUT /budget/:id - Update budget
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const userId = req.user.sub || req.user.userId;
    const data = await this.budgetsService.update(id, userId, updateBudgetDto);
    return { success: true, data };
  }

  /**
   * DELETE /budget/:id - Delete budget
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub || req.user.userId;
    const data = await this.budgetsService.remove(id, userId);
    return { success: true, data };
  }
}

