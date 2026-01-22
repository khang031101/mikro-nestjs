import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ITokenPayload } from '../auth.interface';
import { ClsService } from 'nestjs-cls';

function extractTokenFromCookie(req: FastifyRequest) {
  const token = req.cookies['access_token'];
  return token!;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly cls: ClsService,
  ) {
    const secret = configService.get<string>('JWT_SECRET')!;
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractTokenFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: ITokenPayload) {
    this.cls.set('userId', payload.sub);
    this.cls.set('userEmail', payload.email);
    return { id: payload.sub, name: payload.name, email: payload.email };
  }
}
