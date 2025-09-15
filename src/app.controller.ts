import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { AppService } from './app.service';
import { OpenAIService } from './openai/openai.service';
import { RedisService } from './redis/redis.service';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly openaiService: OpenAIService,
    private readonly redisService: RedisService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getHello1(): string {
    return this.appService.getHello1();
  }

  @Get()
  getHello2(@Query('name') name?: string): string {
    return this.appService.getHello2(name);
  }

  @Post()
  getHello3(@Body() body: { name: string }): string {
    return this.appService.getHello3(body.name);
  }

  @Post('ai/generate')
  async generateText(
    @Body() body: { prompt: string },
  ): Promise<{ response: string }> {
    const response = await this.openaiService.generateText(body.prompt);
    return { response };
  }

  @Post('ai/embedding')
  async generateEmbedding(
    @Body() body: { text: string },
  ): Promise<{ embedding: number[] }> {
    const embedding = await this.openaiService.generateEmbedding(body.text);
    return { embedding };
  }

  // Redis 관련 엔드포인트들
  @Post('redis/set')
  async setRedisValue(
    @Body() body: { key: string; value: string; ttl?: number },
  ): Promise<{ success: boolean }> {
    await this.redisService.set(body.key, body.value, body.ttl);
    return { success: true };
  }

  @Get('redis/get')
  async getRedisValue(
    @Query('key') key: string,
  ): Promise<{ value: string | null }> {
    const value = await this.redisService.get(key);
    return { value };
  }

  @Post('redis/delete')
  async deleteRedisValue(
    @Body() body: { key: string },
  ): Promise<{ deleted: number }> {
    const deleted = await this.redisService.del(body.key);
    return { deleted };
  }

  @Post('redis/hash/set')
  async setHashValue(
    @Body() body: { key: string; field: string; value: string },
  ): Promise<{ success: boolean }> {
    await this.redisService.setHash(body.key, body.field, body.value);
    return { success: true };
  }

  @Get('redis/hash/get')
  async getHashValue(
    @Query('key') key: string,
    @Query('field') field: string,
  ): Promise<{ value: string | undefined }> {
    const value = await this.redisService.getHash(key, field);
    return { value };
  }

  @Get('redis/hash/all')
  async getAllHashValues(
    @Query('key') key: string,
  ): Promise<{ data: Record<string, string> }> {
    const data = await this.redisService.getAllHash(key);
    return { data };
  }

  @Post('redis/list/add')
  async addToList(
    @Body() body: { key: string; value: string },
  ): Promise<{ length: number }> {
    const length = await this.redisService.addToList(body.key, body.value);
    return { length };
  }

  @Get('redis/list/get')
  async getListValues(
    @Query('key') key: string,
    @Query('start') start: string = '0',
    @Query('end') end: string = '-1',
  ): Promise<{ values: string[] }> {
    const values = await this.redisService.getList(
      key,
      parseInt(start),
      parseInt(end),
    );
    return { values };
  }

  // 데이터베이스 관련 엔드포인트들
  @Post('db/embedding/save')
  async saveEmbedding(
    @Body()
    body: {
      text: string;
      category?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ id: string; success: boolean }> {
    // OpenAI를 사용해 임베딩 생성
    const embedding = await this.openaiService.generateEmbedding(body.text);

    // 데이터베이스에 저장
    const result = await this.databaseService.saveEmbedding(
      body.text,
      embedding,
      body.category,
      body.metadata,
    );

    return { id: result.id, success: true };
  }

  @Post('db/embedding/search')
  async searchSimilarEmbeddings(
    @Body()
    body: {
      text: string;
      limit?: number;
      threshold?: number;
    },
  ): Promise<{ results: any[] }> {
    // 검색 텍스트의 임베딩 생성
    const queryEmbedding = await this.openaiService.generateEmbedding(
      body.text,
    );

    // 유사한 임베딩 검색
    const results = await this.databaseService.findSimilarEmbeddings(
      queryEmbedding,
      body.limit || 10,
      body.threshold || 0.8,
    );

    return { results };
  }

  @Get('db/embedding/category/:category')
  async getEmbeddingsByCategory(
    @Param('category') category: string,
  ): Promise<{ embeddings: any[] }> {
    const embeddings =
      await this.databaseService.findEmbeddingsByCategory(category);
    return { embeddings };
  }

  @Get('db/embedding/search-text')
  async searchEmbeddingsByText(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('limit') limit: string = '10',
  ): Promise<{ results: any[] }> {
    const results = await this.databaseService.searchEmbeddings(
      query,
      parseInt(limit),
      category,
    );
    return { results };
  }

  @Get('db/embedding/all')
  async getAllEmbeddings(
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0',
  ): Promise<{ embeddings: any[]; total: number }> {
    const [embeddings, total] = await Promise.all([
      this.databaseService.getAllEmbeddings(parseInt(limit), parseInt(offset)),
      this.databaseService.getEmbeddingCount(),
    ]);

    return { embeddings, total };
  }

  @Delete('db/embedding/:id')
  async deleteEmbedding(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.databaseService.deleteEmbedding(id);
    return { success };
  }

  @Post('db/embedding/:id/update')
  async updateEmbedding(
    @Param('id') id: string,
    @Body()
    body: {
      text?: string;
      category?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ success: boolean; embedding?: any }> {
    const result = await this.databaseService.updateEmbedding(
      id,
      body.text,
      body.category,
      body.metadata,
    );

    if (!result) {
      return { success: false };
    }

    return { success: true, embedding: result };
  }
}
