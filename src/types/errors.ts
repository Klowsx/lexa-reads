export type AppErrorCode =
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export interface AppError {
  code: AppErrorCode;
  message: string;
  originalError?: unknown;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof TypeError && error.message === "Network request failed") {
    return { code: "NETWORK_ERROR", message: "Sin conexión a internet", originalError: error };
  }

  if (typeof error === "object" && error !== null && "code" in error && "message" in error) {
    const e = error as { code: string; message: string };
    if (e.code === "PGRST116") return { code: "NOT_FOUND", message: "No encontrado", originalError: error };
    if (e.code === "42501") return { code: "FORBIDDEN", message: "Sin permiso", originalError: error };
    if (e.code?.startsWith("auth/") || e.code?.startsWith("Auth"))
      return { code: "AUTH_ERROR", message: e.message, originalError: error };
    return { code: "UNKNOWN", message: e.message, originalError: error };
  }

  return { code: "UNKNOWN", message: "Ocurrió un error inesperado", originalError: error };
}
