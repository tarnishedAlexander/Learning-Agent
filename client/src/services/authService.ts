import jsonInstance from "../api/jsonIntance";
import type { LoginPayload, LoginResponse } from "../types/auth";
import { ApiError } from "../utils/errors";
import { saveAuth } from "../utils/storage";

export const logout = () => {};

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
