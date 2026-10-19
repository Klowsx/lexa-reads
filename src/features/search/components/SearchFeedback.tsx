import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SearchAction } from './SearchControls'

// Reserva el espacio de los resultados durante la carga sin movimiento innecesario.
export function SearchLoading({ readers = false }: { readers?: boolean }) {
  const { t } = useTranslation()
  return (
    <View
      accessible
      accessibilityLabel={t('search.searching')}
      accessibilityState={{ busy: true }}
      aria-busy
      className="gap-5 pb-6"
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className="flex-row items-start gap-4"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View
            className={
              readers ? 'h-12 w-12 rounded-full bg-sr' : 'h-28 rounded-sm bg-sr'
            }
            style={!readers ? { width: 72 } : undefined}
          />
          <View className="flex-1 gap-3 py-2">
            <View className="h-5 w-4/5 rounded-sm bg-sr" />
            <View className="h-4 w-3/5 rounded-sm bg-surface" />
            {!readers && <View className="h-4 w-2/5 rounded-sm bg-surface" />}
          </View>
        </View>
      ))}
    </View>
  )
}

// Explica un vacío o un fallo y ofrece una salida concreta en el mismo lugar.
export function SearchFeedback({
  title,
  message,
  action,
  onAction
}: {
  title: string
  message: string
  action?: string
  onAction?: () => void
}) {
  return (
    <View className="mb-6 gap-3 rounded-card bg-surface p-5">
      <Text
        accessibilityLiveRegion="polite"
        className="font-body-sb text-sm text-text"
      >
        {title}
      </Text>
      <Text className="font-body text-xs text-t2">{message}</Text>
      {action && onAction && (
        <View className="self-start">
          <SearchAction label={action} onPress={onAction} />
        </View>
      )}
    </View>
  )
}
