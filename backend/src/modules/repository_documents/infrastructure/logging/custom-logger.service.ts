// infrastructure/logging/custom-logger.service.ts

import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContextService } from '../context/request-context.service';

@Injectable()
export class CustomLogger implements LoggerService {
  constructor(private readonly requestContextService: RequestContextService) {}

  log(message: any, context?: string) {
    // Usamos console.log directamente
    process.stdout.write(this.buildMessage(message, context));
  }

  error(message: any, trace?: string, context?: string) {
    process.stderr.write(this.buildMessage(message, context, trace));
  }

  warn(message: any, context?: string) {
    process.stdout.write(this.buildMessage(message, context));
  }

  debug?(message: any, context?: string) {
    process.stdout.write(this.buildMessage(message, context));
  }

  verbose?(message: any, context?: string) {
    process.stdout.write(this.buildMessage(message, context));
  }

  private buildMessage(message: any, context?: string, trace?: string): string {
    const correlationId =
      this.requestContextService.get<string>('correlationId');
    const prefix = correlationId ? `[ID:${correlationId}] ` : '';
    const contextPrefix = context ? `[${context}] ` : '';
    const traceMessage = trace ? `\n${trace}` : '';

    return `${prefix}${contextPrefix}${message}${traceMessage}\n`;
  }
}