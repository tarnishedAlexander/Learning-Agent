import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';

@Module({ imports: [PrismaModule, RbacModule, IdentityModule] })
export class AppModule {}

@Module({
  imports: [DocumentModule],
  providers: [PrismaService],
})
export class AppModule {}
