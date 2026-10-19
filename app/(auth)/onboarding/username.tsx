import { Check } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import {
  AuthField,
  PrimaryButton,
  alpha
} from '../../../src/features/auth/components'
import {
  normalizeUsername,
  useCompleteOnboarding,
  useUsernameAvailability
} from '~/features/auth/hooks/useOnboarding'
import { useDebounce } from '~/lib/useDebounce'
import { useColors } from '~/theme/colors'
import { OnboardingScreen } from '~/features/auth/components/onboarding-screen'

// Pide el nombre público y cierra el onboarding cuando el servidor confirma todos los datos.
export default function OnboardUsernameScreen() {
  const router = useRouter()
  const c = useColors()
  const [username, setUsername] = useState('')
  const debouncedUsername = useDebounce(username, 350)
  const availability = useUsernameAvailability(debouncedUsername)
  const completeOnboarding = useCompleteOnboarding()
  const validFormat = /^[a-z0-9_]{3,30}$/.test(username)
  const isCurrent = username === debouncedUsername
  const isAvailable =
    isCurrent && availability.data === true && !availability.isFetching
  const usernameError = !username
    ? undefined
    : !validFormat
      ? 'Usa de 3 a 30 letras, números o guion bajo.'
      : !isCurrent
        ? undefined
        : availability.isError
          ? 'No pudimos comprobar el nombre. Inténtalo de nuevo.'
          : availability.data === false
            ? 'Este nombre ya está en uso.'
            : undefined
  const completionError = completeOnboarding.error as {
    code?: string
    message?: string
  } | null
  const completionMessage =
    completionError?.code === '23505'
      ? 'Este nombre acaba de ser elegido. Prueba otro.'
      : completionError?.message

  // Normaliza el valor antes de comprobarlo para que la vista previa y la base usen el mismo nombre.
  function handleChange(value: string) {
    if (completeOnboarding.error) completeOnboarding.reset()
    setUsername(normalizeUsername(value))
  }

  // Cierra el onboarding en el servidor y entra a la aplicación solo después de persistirlo.
  function handleComplete() {
    if (!validFormat || !isAvailable || completeOnboarding.isPending) return

    completeOnboarding.mutate(username, {
      onSuccess: () => router.replace('/(tabs)/feed')
    })
  }

  return (
    <OnboardingScreen
      step={3}
      title="Tu firma de lector"
      description="Elige un nombre único para tus reseñas y conversaciones. Este es el último paso."
      onBack={() => router.replace('/(auth)/onboarding/goal')}
      busy={completeOnboarding.isPending}
      footer={
        <>
          {completionMessage && (
            <Text
              accessibilityLiveRegion="polite"
              className="font-body text-error text-xs mb-3"
            >
              {completionMessage}
            </Text>
          )}
          <PrimaryButton
            disabled={!validFormat || !isAvailable}
            loading={completeOnboarding.isPending}
            onPress={handleComplete}
          >
            Entrar a Lexa
          </PrimaryButton>
        </>
      }
    >
      <View>
        <View className="self-center mb-7 relative">
          <View
            className="w-[92px] h-[92px] rounded-full items-center justify-center border-2"
            style={{
              backgroundColor: alpha(c.accent, 0.18),
              borderColor: c.accent
            }}
          >
            <Text className="font-body-sb text-[34px] text-accent">
              {username.slice(0, 2).toUpperCase() || '··'}
            </Text>
          </View>
        </View>

        <AuthField
          label="Nombre de usuario"
          value={username}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoComplete="username-new"
          textContentType="username"
          icon={<Text className="font-body-md text-t3 text-[14px]">@</Text>}
          trailing={
            isAvailable && !availability.isFetching ? (
              <Check size={16} color={c.success} />
            ) : undefined
          }
          error={usernameError}
        />

        <Text
          className="font-body text-t2 mt-1 text-xs"
          accessibilityLiveRegion="polite"
        >
          {validFormat && (!isCurrent || availability.isFetching)
            ? 'Comprobando disponibilidad… '
            : isAvailable
              ? 'Disponible: '
              : 'Tu nombre público: '}
          @<Text className="text-text">{username || 'tu_nombre'}</Text>
        </Text>
      </View>
    </OnboardingScreen>
  )
}
