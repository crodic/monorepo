import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, JobsOptions, Queue } from 'bullmq';
import {
  ISendMailOptions,
  MAIL_QUEUE_NAME,
  SEND_MAIL_JOB,
} from '../constants/mail.constant';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(
    @InjectQueue(MAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<ISendMailOptions>,
  ) {}

  async sendMail(
    options: ISendMailOptions,
    jobOptions?: JobsOptions,
  ): Promise<Job<ISendMailOptions>> {
    const job = await this.emailQueue.add(SEND_MAIL_JOB, options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400, // keep 1 day
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // keep 7 days
      },
      ...jobOptions,
    });

    this.logger.debug(
      `Enqueued email job ${job.id} for ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
    );

    return job;
  }
}
