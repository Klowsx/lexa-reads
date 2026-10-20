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
        className="flex-row items-center gap-3 px-4 py-3"
        style={({ pressed }) => ({
          backgroundColor: pressed && onPress ? c.sh : 'transparent'
        })}
      >
        <View className="flex-1 min-w-0">
          <Text
            className="text-sm font-body-md"
            style={{ color: danger ? c.error : c.text }}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text className="text-xs font-body text-t3 mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        {trailing !== undefined ? (
          trailing
        ) : onPress ? (
          <ChevronRight size={16} color={c.t3} strokeWidth={1.6} />
        ) : null}
      </Pressable>
      {separator && <View className="h-px bg-border opacity-70 mx-4" />}
    </>
  )
}
