import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';

@Injectable()
export class SessionPrismaRepository implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(p: {
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.prisma.userSession.create({
      data: {
        userId: p.userId,
        token: p.token,
        refresh_token: p.refreshToken,
        expiresAt: p.expiresAt,
        ipAddress: p.ipAddress,
        userAgent: p.userAgent,
      },
    });
  }

  async findByRefreshToken(refreshToken: string) {
    const s = await this.prisma.userSession.findFirst({
      where: { refresh_token: refreshToken },
      select: { id: true, userId: true, expiresAt: true, refresh_token: true },
    });
    return s
      ? {
          id: s.id,
          userId: s.userId,
          expiresAt: s.expiresAt,
          refreshToken: s.refresh_token,
        }
      : null;
  }

  async revokeById(sessionId: string) {
    await this.prisma.userSession.delete({ where: { id: sessionId } });
  }

  async revokeAll(userId: string) {
    await this.prisma.userSession.deleteMany({ where: { userId } });
  }
}
