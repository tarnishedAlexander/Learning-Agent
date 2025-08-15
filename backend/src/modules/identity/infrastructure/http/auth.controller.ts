import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { LoginUseCase } from '../../application/commands/login.usecase';
import { RefreshUseCase } from '../../application/commands/refresh.usecase';
import { LogoutUseCase } from '../../application/commands/logout.usecase';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(200)
  loginEndpoint(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers('user-agent') ua?: string,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;
    return this.login.execute({ ...dto, ip, userAgent: ua });
  }

  @Post('refresh')
  @HttpCode(200)
  refreshEndpoint(@Body() dto: RefreshDto) {
    return this.refresh.execute(dto);
  }

  @Post('logout')
  @HttpCode(200)
  logoutEndpoint(@Body() dto: RefreshDto) {
    return this.logout.execute(dto);
  }
}
