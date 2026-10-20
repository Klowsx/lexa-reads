import { ActivityIndicator, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '~/theme/colors'
import { PrimaryButton } from './PrimaryButton'

// Explica la reanudación y ofrece reintento sin mostrar contenido privado antes de validarla.
export function SessionStatus({
  error = false,
  onRetry
}: {
  error?: boolean
  onRetry?: () => void
}) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View
      className="flex-1 items-center justify-center bg-bg px-container"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="w-full max-w-md gap-5">
        <Text
          accessibilityRole="header"
          className="font-display-sb text-lg text-text"
        >
          {error ? 'Tu biblioteca sigue aquí' : 'Preparando tu biblioteca'}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-xs text-t2"
        >
          {error
            ? 'No pudimos comprobar tu sesión. Revisa tu conexión y vuelve a intentarlo.'
            : 'Estamos comprobando tu acceso de forma segura…'}
        </Text>
        {error && onRetry ? (
          <PrimaryButton onPress={onRetry}>Volver a intentar</PrimaryButton>
        ) : (
          <ActivityIndicator color={c.text} />
        )}
      </View>
    </View>
  )
}
