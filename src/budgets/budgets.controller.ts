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
// @UseGuards(JwtAuthGuard) // Temporarily disabled
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // Helper to get user ID (with default when auth disabled)
  private getUserId(req: any): number {
    if (req.user) {
      return req.user.sub || req.user.userId;
    }
    return 1; // Default user ID for development
  }

  /**
   * GET /budget - Get current budget (optionally filtered by period)
   */
  @Get()
  async findOne(@Request() req, @Query('period') period?: string) {
    const userId = this.getUserId(req);
    const data = await this.budgetsService.findOne(userId, period);
    // Return data directly - interceptor will wrap it
    return data;
  }

  /**
   * POST /budget - Create or update budget
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    const userId = this.getUserId(req);
    const data = await this.budgetsService.createOrUpdate(userId, createBudgetDto);
    // Return data directly - interceptor will wrap it
    return data;
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
    const userId = this.getUserId(req);
    const data = await this.budgetsService.update(id, userId, updateBudgetDto);
    // Return data directly - interceptor will wrap it
    return data;
  }

  /**
   * DELETE /budget/:id - Delete budget
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    const data = await this.budgetsService.remove(id, userId);
    // Return data directly - interceptor will wrap it
    return data;
  }
}

