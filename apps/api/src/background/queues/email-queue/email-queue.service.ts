import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, JobsOptions, Queue } from 'bullmq';
import { ISendMailOptions } from '../../../mail/constants/mail.constant';
import {
  EMAIL_QUEUE_NAME,
  SEND_EMAIL_JOB,
} from './constants/email-queue.constant';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<ISendMailOptions>,
  ) {}

  async sendMail(
    options: ISendMailOptions,
    jobOptions?: JobsOptions,
  ): Promise<Job<ISendMailOptions>> {
    const job = await this.emailQueue.add(SEND_EMAIL_JOB, options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400, // 1 day
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // 7 days
      },
      ...jobOptions,
    });

    this.logger.debug(
      `Enqueued email job ${job.id} for ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
    );

    return job;
  }
}
