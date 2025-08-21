import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentModule } from './modules/repository/document.module';
import { GestionAcademicaModule } from './modules/gestion_academica/gestion_academica.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    IdentityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GestionAcademicaModule,
    ExamsModule,
    DocumentModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
