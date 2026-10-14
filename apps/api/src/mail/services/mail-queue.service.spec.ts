import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { MAIL_QUEUE_NAME, SEND_MAIL_JOB } from '../constants/mail.constant';
import { MailQueueService } from './mail-queue.service';

describe('MailQueueService', () => {
  let service: MailQueueService;
  let queueMock: { add: jest.Mock };

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailQueueService,
        {
          provide: getQueueToken(MAIL_QUEUE_NAME),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<MailQueueService>(MailQueueService);
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
      SEND_MAIL_JOB,
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
