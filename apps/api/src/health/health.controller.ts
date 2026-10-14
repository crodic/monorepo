import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System health check' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage_disk', {
          thresholdPercent: 0.95,
          path: process.platform === 'win32' ? 'C:\\' : '/',
        }),
      async () => {
        try {
          const res = await this.redisService.ping();
          return { redis: { status: res === 'PONG' ? 'up' : 'down' } };
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Redis unavailable';
          return { redis: { status: 'down', message } };
        }
      },
    ]);
  }
}
