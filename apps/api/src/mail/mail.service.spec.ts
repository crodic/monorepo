import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'node:fs';
import { MailService } from './mail.service';

jest.mock('node:fs', () => {
  const actualFs = jest.requireActual<Record<string, unknown>>('node:fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
  };
});

describe('MailService', () => {
  let service: MailService;
  let mailerService: { sendMail: any };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-123' })),
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render a template when template file exists', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue('Hello, {{name}}! Code: {{code}}');

    const html = service.renderTemplate('sample', {
      name: 'Alice',
      code: '123456',
    });

    expect(html).toBe('Hello, Alice! Code: 123456');
  });

  it('should throw an error when template file is not found', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    expect(() => service.renderTemplate('non-existent', {})).toThrow(
      /Email template "non-existent" not found/,
    );
  });

  it('should send direct mail and call mailerService', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue('<p>Message for {{name}}</p>');

    const result = await service.sendDirectMail({
      to: 'user@example.com',
      subject: 'Notification',
      template: 'sample',
      context: {
        name: 'Alice',
      },
    });

    expect(result.html).toBe('<p>Message for Alice</p>');
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"No Reply" <noreply@example.com>',
        to: 'user@example.com',
        subject: 'Notification',
        html: '<p>Message for Alice</p>',
      }),
    );
  });
});
