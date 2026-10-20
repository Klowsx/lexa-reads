import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { fixed } from '~/theme/colors'

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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="w-full min-h-12 items-center justify-center rounded-md bg-accent active:opacity-80"
      style={isDisabled ? { opacity: 0.42 } : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      aria-busy={Boolean(loading)}
    >
      <View className="flex-row items-center gap-2">
        {loading && <ActivityIndicator size="small" color={fixed.onAccent} />}
        <Text className="text-white text-base font-body-bold">{children}</Text>
      </View>
    </Pressable>
  )
}
