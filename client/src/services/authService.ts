import jsonInstance from "../api/jsonIntance";
import type { LoginPayload, LoginResponse } from "../types/auth";
import { ApiError } from "../utils/errors";

export const logout = () => {};

export const login = async (payload: LoginPayload) => {
  try {
    const response = await jsonInstance.post<LoginResponse>(
      "/auth/login",
      payload
    );
    return response.data;
  } catch (error) {
    throw new ApiError("Error al iniciar sesión", 401, error);
  }
};
