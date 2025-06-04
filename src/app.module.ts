/*
 * @Author: Mr.Crab wei17306927526@gmail.com
 * @Date: 2025-05-28 11:18:56
 * @LastEditors: Mr.Crab wei17306927526@gmail.com
 * @LastEditTime: 2025-05-28 12:33:41
 * @FilePath: /workflow-system/src/app.module.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { DashboardModule } from './modules/dashboard.module'
import { AuthModule } from './modules/auth.module'
import { UserModule } from './modules/user.module'
import { TenantModule } from './modules/tenant.module'
import { join } from 'path'
import { TenantController } from './controllers/tenant.controller'
import { TenantService } from './services/tenant.service'
import { Tenant } from './entities/tenant.entity'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '../database.sqlite'),
      entities: [Tenant],
      synchronize: true, // 开发环境使用，生产环境请设置为false
    }),
    TypeOrmModule.forFeature([Tenant]),
    AuthModule,
    UserModule,
    DashboardModule,
    TenantModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
})
export class AppModule {} 