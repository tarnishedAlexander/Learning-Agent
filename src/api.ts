// Tipos para respuestas y errores
export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Configuración por defecto
const DEFAULT_TIMEOUT = 5000; // 5 segundos

// Función base para peticiones HTTP
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw {
        message: response.statusText,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw {
        message: 'Request timeout',
        status: 408,
        code: 'TIMEOUT',
      };
    }
    throw {
      message: error.message || 'Network error',
      status: error.status || 500,
      code: error.code,
    };
  }
}

// Funciones helper
export const api = {
  get: <T>(url: string, options?: RequestInit, timeout?: number) =>
    fetchWithTimeout<T>(url, { ...options, method: 'GET' }, timeout),

  post: <T>(url: string, body: any, options?: RequestInit, timeout?: number) =>
    fetchWithTimeout<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      timeout
    ),

  put: <T>(url: string, body: any, options?: RequestInit, timeout?: number) =>
    fetchWithTimeout<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      timeout
    ),

  delete: <T>(url: string, options?: RequestInit, timeout?: number) =>
    fetchWithTimeout<T>(url, { ...options, method: 'DELETE' }, timeout),
};
