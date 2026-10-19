import { Pressable, View } from 'react-native'

type Props = {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  accessibilityLabel?: string
}

// Renderiza una acción secundaria con tamaño táctil, estado deshabilitado y feedback al presionar.
export function GhostButton({
  children,
  onPress,
  disabled = false,
  accessibilityLabel
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-1 min-h-12 rounded-md bg-transparent border border-border"
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1
      })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <View className="flex-1 flex-row items-center justify-center gap-2">
        {children}
      </View>
    </Pressable>
  )
}
