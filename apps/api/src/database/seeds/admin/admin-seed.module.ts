import { AdminAccountEntity } from '../../../api/admin-user/entities/admin-account.entity';
import { AdminUserEntity } from '../../../api/admin-user/entities/admin-user.entity';
import { AdminPermissionEntity } from '../../../api/admin-permission/entities/admin-permission.entity';
import { AdminRoleEntity } from '../../../api/admin-role/entities/admin-role.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSeedService } from './admin-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUserEntity,
      AdminAccountEntity,
      AdminPermissionEntity,
      AdminRoleEntity,
    ]),
  ],
  providers: [AdminSeedService],
  exports: [AdminSeedService],
})
export class AdminSeedModule {}
