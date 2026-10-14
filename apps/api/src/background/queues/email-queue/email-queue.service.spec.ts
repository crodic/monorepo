import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EMAIL_QUEUE_NAME,
  SEND_EMAIL_JOB,
} from './constants/email-queue.constant';
import { EmailQueueService } from './email-queue.service';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let queueMock: { add: any };

  beforeEach(async () => {
    queueMock = {
      add: jest.fn(() => Promise.resolve({ id: 'job-1' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        {
          provide: getQueueToken(EMAIL_QUEUE_NAME),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enqueue email job with default retry and retention options', async () => {
    const mailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      template: 'test',
      context: { foo: 'bar' },
    };

    const result = await service.sendMail(mailOptions);

    expect(result).toEqual({ id: 'job-1' });
    expect(queueMock.add).toHaveBeenCalledWith(
      SEND_EMAIL_JOB,
      mailOptions,
      expect.objectContaining({
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }),
    );
  });
});
