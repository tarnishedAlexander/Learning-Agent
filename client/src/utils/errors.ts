export class ApiError extends Error {
  status?: number;
  data?: unknown;
  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const getErrorMessage = (e: unknown) => {
  if (e instanceof ApiError && e.data && typeof e.data === "object" && "message" in e.data) {
    return (e.data as { message?: string }).message || (e as Error).message || "Error inesperado";
  }
  return (e as Error)?.message || "Error inesperado";
};
