import { User } from '@/entities/user.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityManager,
  EntityRepository,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { ClsService } from 'nestjs-cls';
import { UserService } from '../users/user.service';
import { AuthRedisService } from './auth-redis.service';
import { REFRESH_TOKEN_TTL } from './auth.const';
import { IAuthResponse, IGoogleUser, ITokenPayload } from './auth.interface';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly cls: ClsService,
    private readonly authRedis: AuthRedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findOneByEmail(email);

    if (user && user.password && (await compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: ITokenPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    await this.authRedis.setRefreshToken(
      user.id,
      refreshToken,
      REFRESH_TOKEN_TTL,
    );

    return { accessToken, refreshToken };
  }

  async signIn(dto: SignInDto): Promise<IAuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return { user, accessToken, refreshToken };
  }

  async signUp(dto: SignUpDto): Promise<IAuthResponse> {
    const user = new User({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    this.em.persist(user);

    try {
      await this.em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    return { user, accessToken, refreshToken };
  }

  async refreshTokens(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload: ITokenPayload = this.jwtService.verify(token);
      const storedToken = await this.authRedis.getRefreshToken(payload.sub);

      if (!storedToken || storedToken !== token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userService.findOneById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      Logger.error('Error refreshing tokens', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async signOut(userId: string): Promise<void> {
    await this.authRedis.deleteRefreshToken(userId);
  }

  async googleLogin(googleUser: IGoogleUser): Promise<IAuthResponse> {
    let user = await this.userRepository.findOne({
      $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
    });

    if (!user) {
      user = new User({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
      });
      this.em.persist(user);
    } else {
      user.googleId = googleUser.googleId;
      user.avatarUrl = googleUser.avatarUrl;
    }

    await this.em.flush();

    const { accessToken, refreshToken } = await this.generateTokens(user);
    return { user, accessToken, refreshToken };
  }

  async getMe(): Promise<User | null> {
    const userId = this.cls.get('userId');

    if (!userId) {
      return null;
    }

    return this.userService.findOneById(userId);
  }
}
