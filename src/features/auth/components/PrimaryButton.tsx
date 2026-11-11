import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

type Props = {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  accessibilityLabel?: string
}

// Renderiza la acción principal con estados táctiles y feedback de carga explícito.
export function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
  accessibilityLabel
}: Props) {
  const isDisabled = disabled || loading
  const c = useColors()

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="w-full min-h-12 px-5 py-3 items-center justify-center rounded-md bg-accent active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      style={isDisabled ? { opacity: 0.42 } : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      aria-busy={Boolean(loading)}
    >
      <View className="flex-row items-center gap-2">
        {loading && <ActivityIndicator size="small" color={c.onAccent} />}
        <Text
          className="text-sm font-body-sb text-center"
          style={{ color: c.onAccent }}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  )
}
