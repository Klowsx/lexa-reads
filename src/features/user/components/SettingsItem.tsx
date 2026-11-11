import { ChevronRight } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

interface Props {
  label: string
  subtitle?: string
  trailing?: ReactNode
  onPress?: () => void
  danger?: boolean
  separator?: boolean
}

// Presenta una fila de ajustes y anuncia como botón las filas que ejecutan acciones.
export function SettingsItem({
  label,
  subtitle,
  trailing,
  onPress,
  danger,
  separator = true
}: Props) {
  const c = useColors()

  return (
    <>
      <Pressable
        onPress={onPress}
        accessible={Boolean(onPress)}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? label : undefined}
        className="min-h-16 flex-row items-center gap-3 px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        style={({ pressed }) => ({
          backgroundColor: pressed && onPress ? c.sh : 'transparent'
        })}
      >
        <View className="flex-1 min-w-0">
          <Text
            className="text-sm font-body-sb"
            style={{ color: danger ? c.error : c.text }}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text className="text-xs font-body text-t2 mt-1 leading-5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing !== undefined ? (
          trailing
        ) : onPress ? (
          <ChevronRight size={16} color={c.t3} strokeWidth={1.6} />
        ) : null}
      </Pressable>
      {separator && <View className="h-px bg-border opacity-40 mx-4" />}
    </>
  )
}
