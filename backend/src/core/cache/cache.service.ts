import { Injectable, Inject } from '@nestjs/common';
import * as Redis from 'ioredis';
import crypto from 'crypto';

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis.Redis) {}

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async get(question: string): Promise<string | null> {
    const key = this.hashKey(question);
    return this.redis.get(key);
  }

  async set(question: string, answer: string, ttlSeconds = 86400): Promise<void> {
    const key = this.hashKey(question);
    await this.redis.set(key, answer, 'EX', ttlSeconds);
  }
}
