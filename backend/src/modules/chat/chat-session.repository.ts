import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';


@Injectable()
export class ChatSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(sessionKey: string, prompt: string, answer: string, expiresAt: Date) {
    return this.prisma['chatSession'].create({
      data: { sessionKey, prompt, answer, expiresAt },
    });
  }

  async findBySessionKey(sessionKey: string) {
    return this.prisma['chatSession'].findUnique({
      where: { sessionKey },
    });
  }

  async deleteOldSessions(expirationDate: Date) {
    return this.prisma['chatSession'].deleteMany({
      where: { expiresAt: { lt: expirationDate } },
    });
  }
}
