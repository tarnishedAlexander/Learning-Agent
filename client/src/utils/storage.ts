const AUTH_KEY = "auth";

export type AuthData = {
  accessToken: string | null;
  refreshToken?: string | null;
};

export function saveAuth(data: AuthData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function readAuth(): AuthData {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
  } catch {
    return {
      accessToken: null,
    };
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
