import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmbeddingEntity } from './entities/embedding.entity';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME') || 'nest_ai',
        entities: [EmbeddingEntity],
        synchronize: true, // 개발 환경에서만 사용, 프로덕션에서는 false
        logging: true, // 개발 환경에서만 사용
        extra: {
          // pgvector 확장 활성화
          extensions: ['vector'],
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([EmbeddingEntity]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
