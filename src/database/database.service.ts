import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbeddingEntity } from './entities/embedding.entity';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(EmbeddingEntity)
    private embeddingRepository: Repository<EmbeddingEntity>,
  ) {}

  async saveEmbedding(
    text: string,
    embedding: number[],
    category?: string,
    metadata?: Record<string, any>,
  ): Promise<EmbeddingEntity> {
    const embeddingEntity = this.embeddingRepository.create({
      text,
      embedding,
      category,
      metadata,
    });

    return await this.embeddingRepository.save(embeddingEntity);
  }

  async findSimilarEmbeddings(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.8,
  ): Promise<EmbeddingEntity[]> {
    // pgvector의 cosine similarity를 사용한 유사도 검색
    const query = `
      SELECT *, 
             (1 - (embedding::vector <=> $1::vector)) as similarity
      FROM embeddings 
      WHERE (1 - (embedding::vector <=> $1::vector)) > $2
      ORDER BY embedding::vector <=> $1::vector
      LIMIT $3
    `;

    return await this.embeddingRepository.query(query, [
      `[${queryEmbedding.join(',')}]`,
      threshold,
      limit,
    ]);
  }

  async findEmbeddingsByCategory(category: string): Promise<EmbeddingEntity[]> {
    return await this.embeddingRepository.find({
      where: { category },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllEmbeddings(
    limit: number = 100,
    offset: number = 0,
  ): Promise<EmbeddingEntity[]> {
    return await this.embeddingRepository.find({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteEmbedding(id: string): Promise<boolean> {
    const result = await this.embeddingRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async updateEmbedding(
    id: string,
    text?: string,
    category?: string,
    metadata?: Record<string, any>,
  ): Promise<EmbeddingEntity | null> {
    const embedding = await this.embeddingRepository.findOne({ where: { id } });
    if (!embedding) {
      return null;
    }

    if (text) embedding.text = text;
    if (category) embedding.category = category;
    if (metadata) embedding.metadata = metadata;

    return await this.embeddingRepository.save(embedding);
  }

  async getEmbeddingCount(): Promise<number> {
    return await this.embeddingRepository.count();
  }

  async searchEmbeddings(
    query: string,
    limit: number = 10,
    category?: string,
  ): Promise<EmbeddingEntity[]> {
    let whereClause = 'text ILIKE $1';
    const params: any[] = [`%${query}%`];

    if (category) {
      whereClause += ' AND category = $2';
      params.push(category);
    }

    return await this.embeddingRepository
      .createQueryBuilder('embedding')
      .where(whereClause, params)
      .orderBy('embedding.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
