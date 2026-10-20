import { AppError } from '~/types'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useRef } from 'react'
import { useAuthStore } from '~/stores/auth.store'
import { saveRecoveryContext } from '../recovery-context'
import {
  requestResetPasswordFn,
  updatePasswordFn,
  finishPasswordRecoveryFn
} from '../auth.queries'

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
  const savedStage = useAuthStore((state) => state.isRecoveryPasswordUpdated)
  const passwordUpdated = useRef(savedStage)

  const mutation = useMutation<void, AppError, { password: string }>({
    // Si falla el cierre, conserva el cambio ya confirmado y reintenta únicamente la revocación.
    mutationFn: async (params) => {
      const store = useAuthStore.getState()
      if (!passwordUpdated.current && !store.isRecoveryPasswordUpdated) {
        await updatePasswordFn(params)
        passwordUpdated.current = true
        store.setRecoveryPasswordUpdated(true)
      }
      if (store.user) await saveRecoveryContext(store.user.id, true)
      await finishPasswordRecoveryFn()
    },
    onSuccess: () => {
      router.replace('/(auth)/success')
    }
  })
  return { ...mutation, passwordUpdated: passwordUpdated.current || savedStage }
}

// Reenvía el enlace desde la confirmación sin apilar otra pantalla de recuperación.
export function useResendPasswordRecoveryLink() {
  return useMutation<void, AppError, { email: string }>({
    mutationFn: requestResetPasswordFn
  })
}
