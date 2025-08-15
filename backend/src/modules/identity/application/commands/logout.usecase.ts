import { Inject, Injectable } from '@nestjs/common';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { SESSION_REPO } from '../../tokens';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPO) private readonly sessions: SessionRepositoryPort,
  ) {}
  async execute(input: { refreshToken: string }) {
    const s = await this.sessions.findByRefreshToken(input.refreshToken);
    if (s) await this.sessions.revokeById(s.id);
    return { ok: true };
  }
}
