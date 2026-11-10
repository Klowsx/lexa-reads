import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { useStitchTheme } from '~/theme/stitch'

// Unifica las acciones nuevas con contraste, foco y bloqueo durante el procesamiento.
export function StitchButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
  destructive = false,
  icon
}: {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  secondary?: boolean
  destructive?: boolean
  icon?: ReactNode
}) {
  const c = useStitchTheme()
  const blocked = disabled || loading
  const foreground = destructive ? c.error : secondary ? c.text : c.onPrimary
  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: secondary || destructive ? c.muted : c.primary,
        opacity: blocked ? 0.5 : pressed ? 0.75 : 1
      })}
    >
      {loading ? <ActivityIndicator color={foreground} /> : icon}
      <Text
        style={{
          fontFamily: c.label,
          fontSize: 16,
          lineHeight: 24,
          color: foreground,
          flexShrink: 1,
          textAlign: 'center'
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}
