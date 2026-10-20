import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { AuthPage } from '~/features/auth/components/auth-page'
import { PrimaryButton, GhostButton } from '~/features/auth/components'
import { completeAuthCallback } from '~/features/auth/auth-callback'
import { useColors } from '~/theme/colors'

// Consume el retorno de registro o recuperación y muestra una salida clara si el enlace no sirve.
export default function AuthCallbackScreen() {
  const url = Linking.useLinkingURL()
  const router = useRouter()
  const { invalid } = useLocalSearchParams<{ invalid?: string }>()
  const c = useColors()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (invalid === '1') {
      setError(
        'El enlace está incompleto, venció o ya fue utilizado. Puedes solicitar otro.'
      )
      return
    }
    if (!url) return
    let active = true
    completeAuthCallback(url)
      .then(({ flow }) => {
        if (!active) return
        router.replace(
          flow === 'recovery' ? '/(auth)/new-password' : '/(auth)/login'
        )
      })
      .catch(() => {
        // Reemplaza también la ruta fallida para retirar sus credenciales mediante Expo Router.
        if (active)
          router.replace({
            pathname: '/(auth)/auth-callback',
            params: { invalid: '1' }
          })
      })
    return () => {
      active = false
    }
  }, [url, router, invalid])

  return (
    <AuthPage
      title={error ? 'Necesitas otro enlace' : 'Abriendo Lexa'}
      description={error ?? 'Estamos validando tu enlace seguro…'}
    >
      {error ? (
        <View className="gap-3">
          <PrimaryButton onPress={() => router.replace('/(auth)/login')}>
            Volver a iniciar sesión
          </PrimaryButton>
          <GhostButton
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            <Text className="font-body text-xs text-text">
              Solicitar recuperación
            </Text>
          </GhostButton>
          <Text
            accessibilityLiveRegion="polite"
            className="font-body text-xs text-t2"
          >
            Si estabas confirmando tu cuenta, puedes reenviar la confirmación
            desde el inicio de sesión.
          </Text>
        </View>
      ) : (
        <ActivityIndicator color={c.text} />
      )}
    </AuthPage>
  )
}
