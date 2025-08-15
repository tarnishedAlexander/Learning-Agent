export interface TokenServicePort {
  signAccess(payload: Record<string, any>, ttl?: string): string;
  signRefresh(payload: Record<string, any>, ttl?: string): string;
  verifyAccess(token: string): Record<string, any>;
  verifyRefresh(token: string): Record<string, any>;
}
