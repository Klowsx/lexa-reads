import type { ReactNode } from 'react'
import { useRouter } from 'expo-router'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackBar } from './BackBar'

// Unifica el marco editorial de acceso con scroll y una vuelta segura a la bienvenida.
export function AuthPage({
  title,
  description,
  children
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackBar
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/(auth)')
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24
        }}
      >
        <View className="mb-8">
          <Text
            accessibilityRole="header"
            className="font-display-sb text-text text-2xl"
          >
            {title}
          </Text>
          <Text className="font-body text-t2 text-xs mt-3 leading-6">
            {description}
          </Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
