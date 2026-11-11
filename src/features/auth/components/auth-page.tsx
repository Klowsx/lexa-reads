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
import { BookOpen } from 'lucide-react-native'
import { useColors } from '~/theme/colors'

// Unifica el marco editorial de acceso con scroll y una vuelta segura a la bienvenida.
export function AuthPage({
  title,
  description,
  children,
  centered = true
}: {
  title: string
  description: string
  children: ReactNode
  centered?: boolean
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
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
          paddingBottom: insets.bottom + 24,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center'
        }}
      >
        <View
          className={`mb-8 gap-3 ${centered ? 'items-center pt-5' : 'pt-3'}`}
        >
          {centered && (
            <View className="h-16 w-16 rounded-full bg-sr items-center justify-center mb-1">
              <BookOpen size={28} color={c.text} />
            </View>
          )}
          <Text
            accessibilityRole="header"
            className={`font-display-sb text-text text-2xl ${centered ? 'text-center' : ''}`}
          >
            {title}
          </Text>
          <Text
            className={`font-body text-t2 text-sm leading-6 ${centered ? 'text-center' : ''}`}
          >
            {description}
          </Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
