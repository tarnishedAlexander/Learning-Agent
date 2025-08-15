import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { AccessPayload, RefreshPayload } from './jwt.types';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  private asExpiresIn(v?: string): jwt.SignOptions['expiresIn'] {
    return (v ??
      process.env.JWT_ACCESS_TTL ??
      '15m') as jwt.SignOptions['expiresIn'];
  }

  private asExpiresInRefresh(v?: string): jwt.SignOptions['expiresIn'] {
    return (v ??
      process.env.JWT_REFRESH_TTL ??
      '7d') as jwt.SignOptions['expiresIn'];
  }

  signAccess(payload: AccessPayload, ttl?: string): string {
    const secret = process.env.JWT_ACCESS_SECRET as jwt.Secret;
    const opts: jwt.SignOptions = { expiresIn: this.asExpiresIn(ttl) };
    return jwt.sign(payload, secret, opts);
  }

  signRefresh(payload: RefreshPayload, ttl?: string): string {
    const secret = process.env.JWT_REFRESH_SECRET as jwt.Secret;
    const opts: jwt.SignOptions = { expiresIn: this.asExpiresInRefresh(ttl) };
    return jwt.sign(payload, secret, opts);
  }

  verifyAccess(token: string): AccessPayload {
    const secret = process.env.JWT_ACCESS_SECRET as jwt.Secret;
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
      throw new UnauthorizedException('Malformed access token');
    }
    return decoded as AccessPayload;
  }

  verifyRefresh(token: string): RefreshPayload {
    const secret = process.env.JWT_REFRESH_SECRET as jwt.Secret;
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !decoded.sub || !decoded.email) {
      throw new UnauthorizedException('Malformed refresh token');
    }
    return decoded as RefreshPayload;
  }
}
