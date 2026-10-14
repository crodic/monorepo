import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: { sendMail: jest.Mock };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'mail.defaultName') return 'No Reply';
              if (key === 'mail.defaultEmail') return 'noreply@example.com';
              return null;
            }),
          },
        },
        {
          provide: MailerService,
          useValue: mailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render email-verification template with context', () => {
    const html = service.renderTemplate('email-verification', {
      email: 'user@example.com',
      url: 'https://example.com/verify?token=123',
    });

    expect(html).toContain('user@example.com');
    expect(html).toContain('https://example.com/verify?token=123');
    expect(html).toContain('Verify your email address');
  });

  it('should render reset-password template with context', () => {
    const html = service.renderTemplate('reset-password', {
      email: 'user@example.com',
      url: 'https://example.com/reset?token=abc',
    });

    expect(html).toContain('user@example.com');
    expect(html).toContain('https://example.com/reset?token=abc');
    expect(html).toContain('Reset your password');
  });

  it('should send direct mail and call mailerService', async () => {
    const result = await service.sendDirectMail({
      to: 'user@example.com',
      subject: 'Verify your account',
      template: 'email-verification',
      context: {
        email: 'user@example.com',
        url: 'https://example.com/verify',
      },
    });

    expect(result.html).toContain('user@example.com');
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Verify your account',
      }),
    );
  });
});
