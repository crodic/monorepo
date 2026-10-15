import { Module } from '@nestjs/common';
import { PermissionModule } from './permission/permission.module';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, PermissionModule, RoleModule],
  exports: [UserModule, PermissionModule, RoleModule],
})
export class ApiModule {}
