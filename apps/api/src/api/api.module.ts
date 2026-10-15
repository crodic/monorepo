import { Module } from '@nestjs/common';
import { AdminPermissionModule } from './admin-permission/admin-permission.module';
import { AdminRoleModule } from './admin-role/admin-role.module';
import { AdminUserModule } from './admin-user/admin-user.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { CmsPageModule } from './cms-page/cms-page.module';
import { EmailModule } from './email/email.module';
import { FileModule } from './file/file.module';
import { LocationModule } from './location/location.module';
import { SettingsModule } from './settings/settings.module';
import { UserModule } from './user/user.module';
import { WhiteLabelModule } from './white-label/white-label.module';

@Module({
  imports: [
    UserModule,
    AdminPermissionModule,
    AdminRoleModule,
    AuthModule,
    AdminUserModule,
    AuditLogModule,
    SettingsModule,
    FileModule,
    EmailModule,
    WhiteLabelModule,
    CmsPageModule,
    LocationModule,
  ],
  exports: [
    UserModule,
    AdminPermissionModule,
    AdminRoleModule,
    AuthModule,
    AdminUserModule,
    AuditLogModule,
    SettingsModule,
    FileModule,
    EmailModule,
    WhiteLabelModule,
    CmsPageModule,
    LocationModule,
  ],
})
export class ApiModule {}
