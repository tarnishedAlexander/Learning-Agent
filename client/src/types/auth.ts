export type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  roles?: string[];
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
};
