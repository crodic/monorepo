import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPermissionEntity } from './entities/admin-permission.entity';
import { AdminPermissionController } from './admin-permission.controller';
import { AdminPermissionService } from './admin-permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminPermissionEntity])],
  controllers: [AdminPermissionController],
  providers: [AdminPermissionService],
  exports: [AdminPermissionService],
})
export class AdminPermissionModule {}
