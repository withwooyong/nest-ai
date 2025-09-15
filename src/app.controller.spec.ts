import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIService } from './openai/openai.service';
import { RedisService } from './redis/redis.service';
import { DatabaseService } from './database/database.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: OpenAIService,
          useValue: {
            generateText: jest.fn(),
            generateEmbedding: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            setHash: jest.fn(),
            getHash: jest.fn(),
            getAllHash: jest.fn(),
            addToList: jest.fn(),
            getList: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            saveEmbedding: jest.fn(),
            findSimilarEmbeddings: jest.fn(),
            findEmbeddingsByCategory: jest.fn(),
            searchEmbeddings: jest.fn(),
            getAllEmbeddings: jest.fn(),
            deleteEmbedding: jest.fn(),
            updateEmbedding: jest.fn(),
            getEmbeddingCount: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello1()).toBe('Hello World!!!');
      expect(appController.getHello2()).toBe('Hello World!!!');
      expect(appController.getHello3({ name: 'John' })).toBe('Hello John!!!');
    });
  });
});
