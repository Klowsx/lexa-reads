import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

interface Props {
  title: string
  children: ReactNode
}

export function SettingsSection({ title, children }: Props) {
  return (
    <View className="mt-[22px]">
      <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase px-4 mb-[7px]">
        {title}
      </Text>
      <View className="mx-4 rounded-md border border-border bg-surface overflow-hidden">
        {children}
      </View>
    </View>
  )
}
