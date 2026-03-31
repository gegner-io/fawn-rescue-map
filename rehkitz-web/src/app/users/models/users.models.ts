export type UserRole = 'admin' | 'dispatcher' | 'viewer';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface ListUsersResponse {
  users: ManagedUser[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  role: UserRole;
  active: boolean;
}

export interface UpsertUserResponse {
  user: ManagedUser;
}
