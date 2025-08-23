export type AuthUser = {
  sub: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
};

export interface AuthQueryPort {
  validateToken(token: string): Promise<AuthUser>;
}

export const AUTH_QUERY_PORT = Symbol('AUTH_QUERY_PORT');
