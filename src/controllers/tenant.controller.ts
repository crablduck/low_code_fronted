import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { TenantService } from '../services/tenant.service'
import { Tenant } from '../entities/tenant.entity'

@Controller('api/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantService.findById(Number(id))
  }

  @Post()
  async create(@Body() data: Partial<Tenant>) {
    const tenant = await this.tenantService.create(data)
    return {
      code: 200,
      data: tenant,
      message: '创建租户成功'
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Tenant>) {
    const tenant = await this.tenantService.update(id, data)
    return {
      code: 200,
      data: tenant,
      message: '更新租户成功'
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.tenantService.delete(id)
    return {
      code: 200,
      data: null,
      message: '删除租户成功'
    }
  }
} 