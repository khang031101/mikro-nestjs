import { User } from '@/entities/user.entity';

export interface ITokenPayload {
  sub: string;
  name?: string;
  email: string;
}

export interface IAuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface IGoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  accessToken?: string;
}
