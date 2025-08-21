import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';

type AccessPayload = { sub: string; email: string; sid?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const bearerExtractor: JwtFromRequestFunction<Request> = (req) =>
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');

    const options: StrategyOptions = {
      jwtFromRequest: bearerExtractor,
      secretOrKey: secret,
      ignoreExpiration: false,
    };

    super(options);
  }

  validate(payload: AccessPayload) {
    return payload;
  }
}
