import '../global.css'
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold
} from '@expo-google-fonts/playfair-display'
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold
} from '@expo-google-fonts/dm-sans'
import { useEffect } from 'react'
import { AppState, Platform, View } from 'react-native'
import { Stack } from 'expo-router'
import { QueryClientProvider, focusManager } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { useFonts } from 'expo-font'
import { useThemeStore } from '~/stores/theme.store'
import { queryClient } from '~/lib/query-client'
import i18n from '~/lib/i18n'
import { ConsentModal } from '~/features/user/components/ConsentModal'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { AuthGate } from '~/features/auth/components/auth-gate'
import { SessionStatus } from '~/features/auth/components/session-status'
import { useAuthSession } from '~/features/auth/hooks/use-auth-session'

// Inicializa fuentes y proveedores; la funcionalidad de acceso mantiene una única sesión y un único callback.
function RootLayout() {
  const scheme = useThemeStore((state) => state.scheme)
  const { isLoading, restoreError, retryRestore } = useAuthSession()
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold
  })

  // Refresca las consultas al volver a primer plano sin duplicar la renovación de Supabase.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active')
    })
    return () => subscription.remove()
  }, [])

  if (!fontsLoaded) return null
  return (
    <View className={scheme === 'dark' ? 'flex-1 dark' : 'flex-1'}>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            {isLoading || restoreError ? (
              <SessionStatus error={restoreError} onRetry={retryRestore} />
            ) : (
              <>
                <AuthGate />
                <ConsentModal />
                <Stack screenOptions={{ headerShown: false }} />
              </>
            )}
          </QueryClientProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </View>
  )
}

export default RootLayout
