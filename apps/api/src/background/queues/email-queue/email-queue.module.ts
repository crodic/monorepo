import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailModule } from '../../../mail/mail.module';
import { EMAIL_QUEUE_NAME } from './constants/email-queue.constant';
import { EmailProcessor } from './email.processor';
import { EmailQueueEvents } from './email-queue.events';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
    }),
    BullBoardModule.forFeature({
      name: EMAIL_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
    MailModule,
  ],
  providers: [EmailQueueService, EmailProcessor, EmailQueueEvents],
  exports: [EmailQueueService],
})
export class EmailQueueModule {}
