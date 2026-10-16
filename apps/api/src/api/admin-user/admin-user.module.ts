import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailQueueModule } from '../../background/queues/email-queue/email-queue.module';
import { AdminPermissionEntity } from '../admin-permission/entities/admin-permission.entity';
import { AdminRoleEntity } from '../admin-role/entities/admin-role.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { AdminAccountEntity } from './entities/admin-account.entity';
import { AdminUserEntity } from './entities/admin-user.entity';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    EmailQueueModule,
    TypeOrmModule.forFeature([
      AdminRoleEntity,
      AdminPermissionEntity,
      AdminUserEntity,
      AdminAccountEntity,
    ]),
    JwtModule.register({}),
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
