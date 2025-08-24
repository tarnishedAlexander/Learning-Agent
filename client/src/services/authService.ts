import jsonInstance from "../api/jsonIntance";
import apiClient from "../api/apiClient";
import type {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
} from "../types/auth";
import { ApiError } from "../utils/errors";
import { saveAuth } from "../utils/storage";

export const logout = () => {};

export const login = async (payload: LoginPayload) => {
  try {
    const response = await apiClient.post<LoginResponse>(
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

export const meAPI = async (token: string) => {
  try {
    const response = await apiClient.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });
    return response.data; 
  } catch (error) {
    throw new ApiError("Error al obtener información del usuario", 401, error);
  }
};