export interface SessionRepositoryPort {
  createSession(params: {
    userId: string;
    token: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;

  findByRefreshToken(refreshToken: string): Promise<{
    id: string;
    userId: string;
    expiresAt: Date;
    refreshToken: string;
  } | null>;

  revokeById(sessionId: string): Promise<void>;
  revokeAll(userId: string): Promise<void>;
}
