import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { ISendMailOptions, SEND_MAIL_JOB } from '../constants/mail.constant';
import { MailService } from '../mail.service';
import { EmailProcessor } from './email.processor';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let mailService: { sendDirectMail: jest.Mock };

  beforeEach(async () => {
    mailService = {
      sendDirectMail: jest.fn().mockResolvedValue({ html: '<p>test</p>' }),
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
      name: SEND_MAIL_JOB,
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
