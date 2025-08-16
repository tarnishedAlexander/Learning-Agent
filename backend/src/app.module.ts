import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ExamsModule } from './modules/exams/exams.module';

@Module({
  imports: [PrismaModule, RbacModule, ExamsModule],
})
export class AppModule {}
