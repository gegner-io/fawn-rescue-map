export type Role = 'admin' | 'dispatcher' | 'viewer';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
}
