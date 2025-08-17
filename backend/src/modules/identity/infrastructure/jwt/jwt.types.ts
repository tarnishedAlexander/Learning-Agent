import { JwtPayload } from 'jsonwebtoken';

export interface AccessPayload extends JwtPayload {
  sub: string;
  email: string;
}

export type RefreshPayload = AccessPayload;
