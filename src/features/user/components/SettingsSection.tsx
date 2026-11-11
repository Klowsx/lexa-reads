import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

interface Props {
  title: string
  children: ReactNode
}

// Agrupa preferencias con las superficies tonales y el ritmo de secciones de Stitch.
export function SettingsSection({ title, children }: Props) {
  return (
    <View className="mt-6">
      <Text className="text-lg font-display-sb text-text px-4 mb-3">
        {title}
      </Text>
      <View className="mx-4 rounded-card bg-surface overflow-hidden">
        {children}
      </View>
    </View>
  )
}
