import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await this.client.connect();
    console.log('Redis 연결 성공');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
      console.log('Redis 연결 종료');
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async setHash(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async getHash(key: string, field: string): Promise<string | undefined> {
    const result = await this.client.hGet(key, field);
    return result || undefined;
  }

  async getAllHash(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async delHash(key: string, field: string): Promise<number> {
    return await this.client.hDel(key, field);
  }

  async setList(key: string, values: string[]): Promise<number> {
    return await this.client.lPush(key, values);
  }

  async getList(
    key: string,
    start: number = 0,
    end: number = -1,
  ): Promise<string[]> {
    return await this.client.lRange(key, start, end);
  }

  async addToList(key: string, value: string): Promise<number> {
    return await this.client.rPush(key, value);
  }

  async removeFromList(key: string, value: string): Promise<number> {
    return await this.client.lRem(key, 0, value);
  }

  async setSet(key: string, members: string[]): Promise<number> {
    return await this.client.sAdd(key, members);
  }

  async getSet(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  async isInSet(key: string, member: string): Promise<boolean> {
    const result = await this.client.sIsMember(key, member);
    return result === 1;
  }

  async removeFromSet(key: string, member: string): Promise<number> {
    return await this.client.sRem(key, member);
  }

  getClient(): RedisClientType {
    return this.client;
  }
}
