import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { Skeleton } from '~/components/ui/Skeleton'
import { useColors } from '~/theme/colors'
import { cn } from '~/lib/utils'

// Comparte el área táctil, el foco y el estado de guardado entre las acciones de listas.
export function ListAction({
  label,
  onPress,
  disabled = false,
  pending = false
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  pending?: boolean
}) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      disabled={disabled || pending}
      onPress={onPress}
      className={cn(
        'min-h-12 flex-row items-center justify-center gap-2 rounded-md bg-sr px-4 py-3 active:opacity-70 hover:bg-sh focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
        disabled && 'opacity-50'
      )}
    >
      {pending && <ActivityIndicator color={c.text} />}
      <Text className="font-body-sb text-xs text-text">{label}</Text>
    </Pressable>
  )
}

// Conserva una salida accesible también cuando se abre una URL directamente.
export function ListHeader({
  title,
  onBack
}: {
  title: string
  onBack?: () => void
}) {
  const c = useColors(),
    router = useRouter(),
    { t } = useTranslation()
  return (
    <View className="flex-row items-center gap-2 border-b border-border px-container py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={
          onBack ??
          (() =>
            router.canGoBack() ? router.back() : router.replace('/profile'))
        }
        className="h-12 w-12 items-center justify-center rounded-md active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronLeft color={c.text} size={24} />
      </Pressable>
      <Text
        accessibilityRole="header"
        className="flex-1 font-body-sb text-sm text-text"
      >
        {title}
      </Text>
    </View>
  )
}

// Mantiene la estructura durante la carga sin animación ornamental.
export function ListLoading() {
  return (
    <View className="gap-6 p-container">
      <Skeleton width="70%" height={38} animate={false} />
      <Skeleton height={72} animate={false} />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={96} animate={false} />
      ))}
    </View>
  )
}
