import { AppError } from '~/types'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { requestResetPasswordFn, updatePasswordFn } from '../auth.queries'

// Envía el enlace de recuperación y muestra los siguientes pasos sin revelar si el correo existe.
export function useRequestResetPassword() {
  const router = useRouter()

  return useMutation<void, AppError, { email: string }>({
    mutationFn: requestResetPasswordFn,
    onSuccess: (_, { email }) => {
      router.push({
        pathname: '/(auth)/recovery-sent',
        params: { email: email.trim() }
      })
    }
  })
}

// Guarda la contraseña y lleva a la confirmación después de cerrar la sesión temporal.
export function useUpdatePassword() {
  const router = useRouter()

  return useMutation<void, AppError, { password: string }>({
    mutationFn: updatePasswordFn,
    onSuccess: () => {
      router.replace('/(auth)/success')
    }
  })
}

// Reenvía el enlace desde la confirmación sin apilar otra pantalla de recuperación.
export function useResendPasswordRecoveryLink() {
  return useMutation<void, AppError, { email: string }>({
    mutationFn: requestResetPasswordFn
  })
}
