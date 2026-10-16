import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { ActivityLoggerService } from './activity-logger.service';
import { ActivityLogEntity } from './entities/activity-log.entity';

describe('ActivityLoggerService', () => {
  let service: ActivityLoggerService;
  const mockRepo = {
    create: jest.fn((log) => log),
    save: jest.fn((log) => Promise.resolve({ id: '1', ...log })),
  };
  const mockCls = {
    get: jest.fn((key: string) => {
      if (key === 'user') return { id: '42' };
      if (key === 'userType') return 'AdminUserEntity';
      if (key === 'ip') return '127.0.0.1';
      if (key === 'userAgent') return 'Jest/Test';
      if (key === 'requestId') return 'req-abc';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLoggerService,
        {
          provide: getRepositoryToken(ActivityLogEntity),
          useValue: mockRepo,
        },
        {
          provide: ClsService,
          useValue: mockCls,
        },
      ],
    }).compile();

    service = module.get<ActivityLoggerService>(ActivityLoggerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('fluent api creates and saves activity log', async () => {
    const mockSubject = { id: 10, name: 'Sample Subject' };
    const result = await service
      .useLog('auth')
      .event('login')
      .performedOn(mockSubject)
      .withProperties({ method: 'password' })
      .log('User signed in');

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        logName: 'auth',
        event: 'login',
        description: 'User signed in',
        subjectId: 10,
        causerId: '42',
        causerType: 'AdminUserEntity',
        properties: expect.objectContaining({
          method: 'password',
          ip: '127.0.0.1',
          userAgent: 'Jest/Test',
        }),
      }),
    );
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toHaveProperty('id', '1');
  });
});
