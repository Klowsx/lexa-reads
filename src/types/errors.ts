export type AppErrorCode =
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

export interface AppError {
  code: AppErrorCode
  message: string
  originalError?: unknown
}

// Códigos de error de Supabase Auth
const SUPABASE_AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión',
  user_already_exists: 'Ya existe una cuenta con ese correo',
  weak_password: 'La contraseña es demasiado débil',
  over_request_rate_limit: 'Demasiados intentos, espera un momento',
  otp_expired: 'El código expiró, solicita uno nuevo',
  token_has_been_revoked: 'La sesión expiró, vuelve a iniciar sesión',
  session_not_found: 'Sesión no encontrada, vuelve a iniciar sesión'
}

export function toAppError(error: unknown): AppError {
  if (
    error instanceof TypeError &&
    error.message === 'Network request failed'
  ) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Sin conexión a internet',
      originalError: error
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  ) {
    const e = error as { code: string; message: string }

    if (e.code === 'PGRST116')
      return {
        code: 'NOT_FOUND',
        message: 'No encontrado',
        originalError: error
      }
    if (e.code === '42501')
      return {
        code: 'FORBIDDEN',
        message: 'Sin permiso',
        originalError: error
      }

    const isAuthError =
      e.code in SUPABASE_AUTH_MESSAGES ||
      (error as Record<string, unknown>).__isAuthError === true
    if (isAuthError) {
      return {
        code: 'AUTH_ERROR',
        message: SUPABASE_AUTH_MESSAGES[e.code] ?? e.message,
        originalError: error
      }
    }

    return { code: 'UNKNOWN', message: e.message, originalError: error }
  }

  return {
    code: 'UNKNOWN',
    message: 'Ocurrió un error inesperado',
    originalError: error
  }
}
