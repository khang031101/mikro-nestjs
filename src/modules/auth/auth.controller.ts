import { CurrentUserId } from '@/common/decorators';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { cookieOptions } from './auth.const';
import { IGoogleUser } from './auth.interface';
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
    const { user, accessToken, refreshToken } =
      await this.authService.signIn(body);
    res.setCookie('access_token', accessToken, cookieOptions);
    res.setCookie('refresh_token', refreshToken, cookieOptions);
    return user;
  }

  @Post('sign-up')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.signUp(body);
    res.setCookie('access_token', accessToken, cookieOptions);
    res.setCookie('refresh_token', refreshToken, cookieOptions);
    return user;
  }

  @Post('refresh')
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const token = req.cookies['refresh_token'];
    if (!token) throw new Error('Refresh token not found');

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(token);
    res.setCookie('access_token', accessToken, cookieOptions);
    res.setCookie('refresh_token', refreshToken, cookieOptions);
    return { success: true };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: FastifyRequest & { user: IGoogleUser },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken } = await this.authService.googleLogin(
      req.user,
    );
    res.setCookie('access_token', accessToken, cookieOptions);
    res.setCookie('refresh_token', refreshToken, cookieOptions);
    // Redirect to frontend instead of returning user
    // return user;
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  async signOut(
    @CurrentUserId() userId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.authService.signOut(userId);
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    return { message: 'Signed out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile() {
    return this.authService.getMe();
  }
}
