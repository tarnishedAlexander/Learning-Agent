import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './core/prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Endpoint temporal para debug: listar usuarios
  @Get('debug/users')
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        email: true,
        name: true,
        lastname: true,
      },
    });
  }
}
