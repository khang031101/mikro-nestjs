import { CookieSerializeOptions } from '@fastify/cookie';

export const cookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
