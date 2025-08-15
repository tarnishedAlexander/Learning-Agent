import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

@Injectable()
export class BcryptHasher implements PasswordHasherPort {
  private readonly rounds = 10;
  hash(plain: string) {
    return bcrypt.hash(plain, this.rounds);
  }
  compare(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
