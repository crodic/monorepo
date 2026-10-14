import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EMAIL_QUEUE_NAME } from './constants/email-queue.constant';

@QueueEventsListener(EMAIL_QUEUE_NAME, { blockingTimeout: 300000 })
export class EmailQueueEvents extends QueueEventsHost {
  private readonly logger = new Logger(EmailQueueEvents.name);

  @OnQueueEvent('added')
  onAdded(job: { jobId: string; name: string }): void {
    this.logger.debug(
      `Job ${job.jobId} of type ${job.name} has been added to the email queue`,
    );
  }

  @OnQueueEvent('waiting')
  onWaiting(job: { jobId: string; prev?: string }): void {
    this.logger.debug(`Job ${job.jobId} is waiting in the email queue`);
  }

  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }): void {
    this.logger.debug(
      `Job ${job.jobId} is now active; previous status was ${job.prev}`,
    );
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string; returnvalue: string }): void {
    this.logger.debug(
      `Job ${job.jobId} has been completed with result: ${job.returnvalue}`,
    );
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; failedReason: string; prev?: string }): void {
    this.logger.error(
      `Job ${job.jobId} has failed with reason: ${job.failedReason}; previous status was ${job.prev}`,
    );
  }
}
