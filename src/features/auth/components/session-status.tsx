import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          {error
            ? t('stitch.authUser.libraryHere')
            : t('stitch.authUser.preparingLibrary')}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-xs text-t2"
        >
          {error
            ? t('stitch.authUser.sessionError')
            : t('stitch.authUser.checkingSession')}
        </Text>
        {error && onRetry ? (
          <PrimaryButton onPress={onRetry}>
            {t('stitch.authUser.retry')}
          </PrimaryButton>
        ) : (
          <ActivityIndicator color={c.text} />
        )}
      </View>
    </View>
  )
}
