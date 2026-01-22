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
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UserService } from '../users/user.service';
import { ITokenPayload } from './auth.interface';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly cls: ClsService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findOneByEmail(email);

    if (user && user.password && (await compare(password, user.password))) {
      return user;
    }

    return null;
  }

  generateAccessToken(user: User) {
    const payload: ITokenPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return this.jwtService.sign(payload);
  }

  async signIn(dto: SignInDto) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateAccessToken(user);

    return { user, token };
  }

  async signUp(dto: SignUpDto) {
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

    return { user, token: this.generateAccessToken(user) };
  }

  async getMe() {
    const userId = this.cls.get('userId');

    if (!userId) {
      return null;
    }

    return this.userService.findOneById(userId);
  }
}
