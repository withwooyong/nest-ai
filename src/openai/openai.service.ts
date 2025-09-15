import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model:
          this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return (
        completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.'
      );
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      throw new Error('OpenAI API 호출 중 오류가 발생했습니다.');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI Embedding API 오류:', error);
      throw new Error('임베딩 생성 중 오류가 발생했습니다.');
    }
  }
}
