import jsonInstance from "../api/jsonIntance";
import apiClient from "../api/apiClient";
import type { LoginPayload, LoginResponse } from "../types/auth";
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