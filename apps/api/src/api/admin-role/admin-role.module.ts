import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPermissionEntity } from '../admin-permission/entities/admin-permission.entity';
import { AdminRoleEntity } from './entities/admin-role.entity';
import { AdminRoleController } from './admin-role.controller';
import { AdminRoleService } from './admin-role.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminRoleEntity, AdminPermissionEntity])],
  controllers: [AdminRoleController],
  providers: [AdminRoleService],
  exports: [AdminRoleService],
})
export class AdminRoleModule {}
