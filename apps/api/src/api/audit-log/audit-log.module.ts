import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLoggerService } from './activity-logger.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { ActivityLogEntity } from './entities/activity-log.entity';
import { AuditLogSubscriber } from './subscribers/audit-log.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLogEntity])],
  providers: [AuditLogSubscriber, AuditLogService, ActivityLoggerService],
  controllers: [AuditLogController],
  exports: [AuditLogService, ActivityLoggerService],
})
export class AuditLogModule {}
