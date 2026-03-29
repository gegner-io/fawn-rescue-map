import jwt from 'jsonwebtoken';
import { AuthTokenPayload, PublicUser } from './models';
import { appConfig } from '../config';

export function signAccessToken(user: PublicUser): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: appConfig.jwtExpiresIn as jwt.SignOptions['expiresIn']
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, appConfig.jwtSecret) as AuthTokenPayload;
}
