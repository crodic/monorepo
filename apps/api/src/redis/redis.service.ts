import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { ChainableCommander } from 'ioredis';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const host = this.configService.getOrThrow('redis.host', { infer: true });
    const port = this.configService.getOrThrow('redis.port', { infer: true });
    const password = this.configService.get('redis.password', { infer: true });
    const tlsEnabled = this.configService.get('redis.tlsEnabled', {
      infer: true,
    });

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      tls: tlsEnabled ? {} : undefined,
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts if redis is not running
        }
        return Math.min(times * 200, 1000);
      },
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  pipeline(): ChainableCommander {
    return this.client.pipeline();
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  // --- String Operations ---

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<'OK' | null> {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.exists(...keys);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // --- Hash Operations ---

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(
    key: string,
    fieldOrObj: string | Record<string, string | number>,
    value?: string | number,
  ): Promise<number> {
    if (typeof fieldOrObj === 'object') {
      return this.client.hset(key, fieldOrObj);
    }
    return this.client.hset(key, fieldOrObj, value!);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    return this.client.hdel(key, ...fields);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hexists(key: string, field: string): Promise<number> {
    return this.client.hexists(key, field);
  }

  async hlen(key: string): Promise<number> {
    return this.client.hlen(key);
  }

  async hkeys(key: string): Promise<string[]> {
    return this.client.hkeys(key);
  }

  async hvals(key: string): Promise<string[]> {
    return this.client.hvals(key);
  }

  // --- Set Operations ---

  async sadd(key: string, ...members: (string | number)[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: (string | number)[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.srem(key, ...members);
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string | number): Promise<number> {
    return this.client.sismember(key, member);
  }

  // --- Sorted Set Operations ---

  async zadd(
    key: string,
    score: number,
    member: string | number,
  ): Promise<number> {
    return this.client.zadd(key, score, member);
  }

  async zrem(key: string, ...members: (string | number)[]): Promise<number> {
    if (members.length === 0) return 0;
    return this.client.zrem(key, ...members);
  }

  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  async zremrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<number> {
    return this.client.zremrangebyscore(key, min, max);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client.status !== 'end') {
        await this.client.quit();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Error disconnecting Redis: ${message}`);
    }
  }
}
