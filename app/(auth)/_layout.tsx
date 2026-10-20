import { Stack } from 'expo-router'
import { View } from 'react-native'

// Mantiene el ancho de lectura; AuthGate centraliza las restricciones de cada flujo.
export default function AuthLayout() {
  return (
    <View className="flex-1 items-center bg-bg">
      <View className="w-full max-w-xl flex-1">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  )
}
