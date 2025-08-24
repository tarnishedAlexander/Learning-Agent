import { Injectable, OnModuleDestroy, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    (this as any).$on('query', (event: any) => {
      this.logger.log(`Query: ${event.query} Params: ${event.params} Duration: ${event.duration}ms`);
    });

    (this as any).$on('error', (event: any) => {
      this.logger.error(`${event.level}: ${event.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    if (process.env.PRISMA_DISABLE === 'true') return;
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Prisma connected to database.');
    } catch (error) {
      this.logger.error('Prisma connection failed: ' + (error as Error).message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connected) await this.$disconnect();
  }
}
