import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { LoginUseCase } from './application/commands/login.usecase';
import { RefreshUseCase } from './application/commands/refresh.usecase';
import { LogoutUseCase } from './application/commands/logout.usecase';
import { USER_REPO, SESSION_REPO, HASHER, TOKEN_SERVICE } from './tokens';
import { UserPrismaRepository } from './infrastructure/persistence/user.prisma.repository';
import { SessionPrismaRepository } from './infrastructure/persistence/session.prisma.repository';
import { BcryptHasher } from './infrastructure/crypto/bcrypt.hasher';
import { JwtTokenService } from './infrastructure/jwt/jwt.token.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    { provide: USER_REPO, useClass: UserPrismaRepository },
    { provide: SESSION_REPO, useClass: SessionPrismaRepository },
    { provide: HASHER, useClass: BcryptHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class IdentityModule {}
