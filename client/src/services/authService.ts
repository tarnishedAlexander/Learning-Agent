import jsonInstance from "../api/jsonIntance";
import type {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
} from "../types/auth";
import { ApiError } from "../utils/errors";
import { saveAuth, readAuth, clearAuth } from "../utils/storage";

export const logout = async () => {
  const { refreshToken } = readAuth();
  try {
    await jsonInstance.post("/auth/logout", { refreshToken });
  } catch (error) {
    throw new ApiError("Error al cerrar sesión", 400, error);
  } finally {
    clearAuth();
  }
};

export const login = async (payload: LoginPayload) => {
  try {
    const response = await jsonInstance.post<LoginResponse>(
      "/auth/login",
      payload
    );
    saveAuth(response.data);
    return response.data;
  } catch (error) {
    throw new ApiError("Error al iniciar sesión", 401, error);
  }
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  try {
    await jsonInstance.post("/auth/forgot-password", payload);
  } catch (error) {
    throw new ApiError("Error al enviar el correo", 400, error);
  }
};
