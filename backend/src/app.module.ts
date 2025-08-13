import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';

@Module({ imports: [PrismaModule, RbacModule] })
export class AppModule {}
