import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { Text, View } from 'react-native'
import { useAuthStore } from '~/stores/auth.store'
import { useMe } from '~/features/user/hooks/useMe'
import { useLogout } from '../hooks/useLogout'
import { getAuthRedirect } from '../auth-route'
import { PrimaryButton } from './PrimaryButton'
import { GhostButton } from './GhostButton'
import { SessionStatus } from './session-status'

// Restringe las pantallas por sesión, recuperación y avance persistido del onboarding.
export function AuthGate() {
  const session = useAuthStore((state) => state.session)
  const isRecoveryMode = useAuthStore((state) => state.isRecoveryMode)
  const segments = useSegments()
  const router = useRouter()
  const profile = useMe()
  const logout = useLogout()
  const redirect = getAuthRedirect({
    segments,
    hasSession: !!session,
    isRecoveryMode,
    profile: profile.data
  })
  const isCallback =
    (segments as string[])[0] === '(auth)' &&
    (segments as string[])[1] === 'auth-callback'
  const waitingForProfile =
    !!session &&
    !isRecoveryMode &&
    !isCallback &&
    (profile.isPending || profile.isError)

  // Mantiene el callback accesible hasta consumir el enlace y evita rutas privadas durante la recuperación.
  useEffect(() => {
    if (redirect) router.replace(redirect)
  }, [redirect, router])

  if (!redirect && !waitingForProfile) return null
  return (
    <View className="absolute inset-0 bg-bg" style={{ zIndex: 10 }}>
      {waitingForProfile && profile.isError ? (
        <View className="flex-1 items-center justify-center px-container">
          <View className="w-full max-w-md gap-5">
            <Text
              accessibilityRole="header"
              className="font-display-sb text-lg text-text"
            >
              Tu biblioteca sigue aquí
            </Text>
            <Text className="font-body text-xs text-t2">
              No pudimos cargar tu perfil. Revisa tu conexión y vuelve a
              intentarlo.
            </Text>
            <PrimaryButton
              loading={profile.isFetching}
              onPress={() => {
                void profile.refetch()
              }}
            >
              Volver a intentar
            </PrimaryButton>
            <GhostButton
              disabled={logout.isPending}
              onPress={() => logout.mutate()}
            >
              <Text className="font-body text-xs text-text">
                Usar otra cuenta
              </Text>
            </GhostButton>
            {logout.error && (
              <Text
                accessibilityLiveRegion="polite"
                className="font-body text-xs text-error"
              >
                No pudimos cerrar la sesión. Inténtalo de nuevo.
              </Text>
            )}
          </View>
        </View>
      ) : (
        <SessionStatus />
      )}
    </View>
  )
}
