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

  private getUserId(req: any): number {
    return req.user?.userId || req.user?.sub;
  }

  @Get()
  async findOne(@Request() req, @Query('period') period?: string) {
    const userId = this.getUserId(req);
    return await this.budgetsService.findOne(userId, period);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    const userId = this.getUserId(req);
    return await this.budgetsService.createOrUpdate(userId, createBudgetDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const userId = this.getUserId(req);
    return await this.budgetsService.update(id, userId, updateBudgetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const userId = this.getUserId(req);
    await this.budgetsService.remove(id, userId);
  }
}
