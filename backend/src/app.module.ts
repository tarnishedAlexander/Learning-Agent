import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ExamsModule } from './modules/exams/exams.module';
import { AiConfigService } from './core/ai/ai.config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),PrismaModule, RbacModule, IdentityModule ,ExamsModule],
  providers: [AiConfigService],
})

export class AppModule {}
