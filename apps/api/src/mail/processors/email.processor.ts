import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  ISendMailOptions,
  MAIL_QUEUE_NAME,
  SEND_MAIL_JOB,
} from '../constants/mail.constant';
import { MailService } from '../mail.service';

@Processor(MAIL_QUEUE_NAME, {
  concurrency: 1,
  limiter: {
    max: 1,
    duration: 150,
  },
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<ISendMailOptions, unknown, string>): Promise<unknown> {
    this.logger.debug(
      `Processing email job ${job.id} (name: ${job.name}) to ${Array.isArray(job.data.to) ? job.data.to.join(', ') : job.data.to}`,
    );

    if (job.name === SEND_MAIL_JOB) {
      return this.mailService.sendDirectMail(job.data);
    }

    throw new Error(`Unknown job name: ${job.name}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.debug(`Email job ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`Email job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Email job ${job.id} failed with error: ${error.message}`,
      error.stack,
    );
  }
}
