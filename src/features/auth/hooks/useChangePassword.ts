import { useMutation } from '@tanstack/react-query'
import { changePasswordFn } from '../auth.queries'
import type { AppError } from '~/types'

// Expone progreso y errores del cambio autenticado sin reutilizar la sesión de recuperación por correo.
export function useChangePassword() {
  return useMutation<
    void,
    AppError,
    { currentPassword: string; password: string }
  >({ mutationFn: changePasswordFn })
}
