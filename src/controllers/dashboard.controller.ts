import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { DashboardService } from '../services/dashboard.service'
import { Dashboard } from '../models/dashboard'
import { AuthGuard } from '../guards/auth.guard'

@Controller('api/dashboards')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  async create(@Body() data: Partial<Dashboard>): Promise<Dashboard> {
    return await this.dashboardService.create(data)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Dashboard> {
    return await this.dashboardService.findById(id)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Dashboard>
  ): Promise<Dashboard> {
    return await this.dashboardService.update(id, data)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.dashboardService.delete(id)
  }

  @Get()
  async findAll(): Promise<Dashboard[]> {
    return await this.dashboardService.findAll()
  }
} 