import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const logger = new Logger('PrismaService');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private connected = false;

  constructor() {
    super();
  }

  async onModuleInit(): Promise<void> {
    const disabled = process.env.PRISMA_DISABLE === 'true';
    if (disabled) {
      logger.log('Prisma auto-connect disabled by PRISMA_DISABLE=true');
      return;
    }

    try {
      await this.$connect();
      this.connected = true;
      logger.log('Prisma connected to database.');
    } catch (error) {
      logger.error('Prisma connection failed: ' + (error as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.$disconnect();
  }
}
