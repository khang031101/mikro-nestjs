import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class AuthRedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async setRefreshToken(userId: string, token: string, ttlSeconds: number) {
    await this.redisClient.set(
      `refresh_token:${userId}`,
      token,
      'EX',
      ttlSeconds,
    );
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return this.redisClient.get(`refresh_token:${userId}`);
  }

  async deleteRefreshToken(userId: string) {
    await this.redisClient.del(`refresh_token:${userId}`);
  }
}
