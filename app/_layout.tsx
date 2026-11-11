import '../global.css'
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader/400Regular'
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader/400Regular_Italic'
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader/600SemiBold'
import { Newsreader_700Bold } from '@expo-google-fonts/newsreader/700Bold'
import { Inter_300Light } from '@expo-google-fonts/inter/300Light'
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold'
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
import { ToastViewport } from '~/components/ui/ToastViewport'
import { useAuthSession } from '~/features/auth/hooks/use-auth-session'

// Inicializa fuentes y proveedores; la funcionalidad de acceso mantiene una única sesión y un único callback.
function RootLayout() {
  const scheme = useThemeStore((state) => state.scheme)
  const { isLoading, restoreError, retryRestore } = useAuthSession()
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
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
            <ToastViewport />
          </QueryClientProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </View>
  )
}

export default RootLayout
