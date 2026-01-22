import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { cookieOptions } from './auth.const';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { user, token } = await this.authService.signIn(body);
    res.setCookie('access_token', token, cookieOptions);
    return user;
  }

  @Post('sign-up')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { user, token } = await this.authService.signUp(body);
    res.setCookie('access_token', token, cookieOptions);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  signOut(@Res({ passthrough: true }) res: FastifyReply) {
    res.setCookie('access_token', '', cookieOptions);
    res.clearCookie('access_token', cookieOptions);
    return { message: 'Signed out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile() {
    return this.authService.getMe();
  }
}
