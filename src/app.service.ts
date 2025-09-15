import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello1(): string {
    return 'Hello World!!!';
  }

  getHello2(name?: string): string {
    if (name) {
      return `Hello ${name}!!!`;
    }
    return 'Hello World!!!';
  }

  getHello3(name: string): string {
    return `Hello ${name}!!!`;
  }
}
