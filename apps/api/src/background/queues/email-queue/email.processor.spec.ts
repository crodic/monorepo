import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { ISendMailOptions } from '../../../mail/constants/mail.constant';
import { MailService } from '../../../mail/mail.service';
import { SEND_EMAIL_JOB } from './constants/email-queue.constant';
import { EmailProcessor } from './email.processor';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mailService: { sendDirectMail: any };

  beforeEach(async () => {
    mailService = {
      sendDirectMail: jest.fn(() => Promise.resolve({ html: '<p>test</p>' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should call mailService.sendDirectMail when job name is send-email', async () => {
    const jobData: ISendMailOptions = {
      to: 'user@example.com',
      subject: 'Hello',
      template: 'test',
      context: {},
    };

    const job = {
      id: 'job-1',
      name: SEND_EMAIL_JOB,
      data: jobData,
    } as unknown as Job<ISendMailOptions, unknown, string>;

    const result = await processor.process(job);

    expect(result).toEqual({ html: '<p>test</p>' });
    expect(mailService.sendDirectMail).toHaveBeenCalledWith(jobData);
  });

  it('should throw an error when job name is unknown', async () => {
    const job = {
      id: 'job-1',
      name: 'unknown-job',
      data: { to: 'user@example.com' },
    } as unknown as Job<ISendMailOptions, unknown, string>;

    await expect(processor.process(job)).rejects.toThrow(
      'Unknown job name: unknown-job',
    );
  });
});
