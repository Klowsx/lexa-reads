import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { PrimaryButton } from '~/features/auth/components'
import { supabase } from '~/lib/supabase'
import { useAuthStore } from '~/stores/auth.store'

type CallbackStatus = 'loading' | 'error'

// Intercambia los tokens del enlace de Supabase por una sesión temporal de recuperación.
function getRecoveryTokens(url: string) {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : ''
  const params = new URLSearchParams(hash || url.slice(url.indexOf('?') + 1))
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    errorDescription: params.get('error_description')
  }
}

// Completa el regreso desde el correo y abre el formulario solo con una sesión de recuperación válida.
export default function AuthCallbackScreen() {
  const url = Linking.useLinkingURL()
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const setRecoveryMode = useAuthStore((state) => state.setRecoveryMode)
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState('Estamos validando tu enlace seguro…')

  useEffect(() => {
    // Recupera la sesión desde el fragmento del enlace sin exponer los tokens en la interfaz.
    async function completeRecovery() {
      if (!url) {
        setMessage('No encontramos un enlace de recuperación válido.')
        setStatus('error')
        return
      }

      const { accessToken, refreshToken, errorDescription } =
        getRecoveryTokens(url)
      if (errorDescription || !accessToken || !refreshToken) {
        setMessage(
          errorDescription ||
            'El enlace es inválido o ya venció. Solicita uno nuevo.'
        )
        setStatus('error')
        return
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      if (error || !data.session) {
        setMessage('No pudimos validar el enlace. Solicita uno nuevo.')
        setStatus('error')
        return
      }

      setRecoveryMode(true)
      setSession(data.session)
      router.replace('/(auth)/new-password')
    }

    void completeRecovery()
  }, [router, setRecoveryMode, setSession, url])

  return (
    <View className="flex-1 bg-bg items-center justify-center px-6">
      <View className="w-full max-w-[360px]">
        <Text className="font-display-sb text-text text-2xl text-center mb-3">
          {status === 'loading' ? 'Abriendo Lexa' : 'Necesitas otro enlace'}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-t2 text-xs leading-6 text-center mb-6"
        >
          {message}
        </Text>
        {status === 'error' && (
          <PrimaryButton
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            Solicitar otro enlace
          </PrimaryButton>
        )}
      </View>
    </View>
  )
}
