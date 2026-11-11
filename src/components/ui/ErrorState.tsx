import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

interface ErrorStateProps {
  onRetry?: () => void
  message?: string
}

/** Estado de error estándar con acción "Reintentar" (UX-2). */
export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      <Text className="font-display-sb text-lg text-text text-center">
        {message ?? t('common.error')}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
          className="mt-1 px-6 py-3 rounded-full bg-accent"
        >
          <Text className="font-body-sb text-sm text-on-accent">
            {t('common.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}
