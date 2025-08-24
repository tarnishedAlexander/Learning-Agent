import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { DomainError } from 'src/modules/exams/domain/entities/domain-error';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    this.logger.error(
      `[${req.method}] ${req.url} -> ${exception.message}`,
      exception.stack,
    );

    res.status(HttpStatus.BAD_REQUEST).json({
      ok: false,
      timestamp: new Date().toISOString(),
      path: req.url,
      error: exception.message,
    });
  }
}
