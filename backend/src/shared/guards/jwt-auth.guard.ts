import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import type { TokenServicePort } from '../../modules/identity/domain/ports/token-service.port';
import { TOKEN_SERVICE } from '../../modules/identity/tokens';

export type RefreshPayload = {
  sub: string;
  email?: string;
  [k: string]: any;
};

type AccessPayload = {
  sub: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  [k: string]: any;
};

function isAccessPayload(x: unknown): x is AccessPayload {
  return (
    typeof x === 'object' &&
    x !== null &&
    'sub' in x &&
    typeof (x as { sub?: unknown }).sub === 'string'
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing/invalid bearer token');

    const decoded = this.tokens.verifyAccess(token);
    if (!isAccessPayload(decoded)) {
      throw new UnauthorizedException(
        'Malformed access token payload (missing sub)',
      );
    }

    (req as Request & { user?: AccessPayload }).user = decoded;
    return true;
  }

  private extractBearer(auth?: string): string | null {
    if (!auth) return null;
    const [type, value] = auth.split(' ');
    return type?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
