import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueName } from '../common/constants/job.constant';
import { AllConfigType } from '../config/config.type';
import { RedisService } from '../redis/redis.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthCheckService;
  let configServiceValue: Partial<
    Record<keyof ConfigService<AllConfigType>, jest.Mock>
  >;
  let healthCheckServiceValue: Partial<
    Record<keyof HealthCheckService, jest.Mock>
  >;
  let dbUseValue: Partial<Record<keyof TypeOrmHealthIndicator, jest.Mock>>;

  beforeAll(async () => {
    configServiceValue = {
      get: jest.fn((key: string) => {
        if (key === 'app.url') return 'http://localhost:8000';
        if (key === 'app.apiPrefix') return 'api';
        return undefined;
      }),
    };

    healthCheckServiceValue = {
      check: jest.fn(),
    };

    dbUseValue = {
      pingCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: configServiceValue,
        },
        {
          provide: HealthCheckService,
          useValue: healthCheckServiceValue,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: dbUseValue,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn(),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
          },
        },
        {
          provide: getQueueToken(QueueName.EMAIL),
          useValue: {
            getJobCounts: jest.fn().mockResolvedValue({
              waiting: 0,
              active: 0,
              completed: 0,
              failed: 0,
            }),
          },
        },
        {
          provide: getQueueToken(QueueName.FILE),
          useValue: {
            getJobCounts: jest.fn().mockResolvedValue({
              waiting: 0,
              active: 0,
              completed: 0,
              failed: 0,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthCheckService>(HealthCheckService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const healthCheckResult = {
        status: 'ok',
        info: {
          db: {
            status: 'up',
          },
        },
        error: {},
      };

      healthCheckServiceValue.check!.mockReturnValue(healthCheckResult);

      const result = await controller.check();

      expect(result).toEqual(healthCheckResult);
      expect(healthCheckServiceValue.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics and bullBoardUrl', async () => {
      const stats = await controller.getQueueStats();
      expect(stats.bullBoardUrl).toContain('/api/queues');
      expect(stats.queues).toHaveLength(2);
      expect(stats.queues[0].name).toBe(QueueName.EMAIL);
      expect(stats.queues[1].name).toBe(QueueName.FILE);
    });
  });
});
