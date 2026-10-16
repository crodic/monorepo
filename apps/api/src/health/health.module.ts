import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { QueueName, QueuePrefix } from '../common/constants/job.constant';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    BullModule.registerQueue(
      {
        name: QueueName.EMAIL,
        prefix: QueuePrefix.AUTH,
      },
      {
        name: QueueName.FILE,
        prefix: QueuePrefix.FILE,
      },
    ),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
