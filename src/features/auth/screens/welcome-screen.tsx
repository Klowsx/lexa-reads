import { Link } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookFan, PrimaryButton, Wordmark } from '~/features/auth/components'

// Recibe a lectores nuevos y habituales con dos destinos claros antes de personalizar el perfil.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24
      }}
    >
      <Wordmark size={32} />
      <View className="flex-1 justify-center min-h-[250px]">
        <BookFan />
      </View>
      <View className="pb-7">
        <Text
          accessibilityRole="header"
          className="font-display-sb text-text text-[36px] leading-[43px]"
        >
          Haz sitio a tus lecturas.
        </Text>
        <Text className="font-body text-t2 text-xs leading-6 mt-4">
          Guarda lo que lees, encuentra tu próxima historia y conversa con
          quienes también la han vivido.
        </Text>
      </View>
      <Link href="/(auth)/register" asChild>
        <PrimaryButton>Crear mi cuenta</PrimaryButton>
      </Link>
      <Link href="/(auth)/login" asChild>
        <Pressable className="min-h-12 items-center justify-center mt-2">
          <Text className="font-body-md text-text text-xs">
            Ya tengo cuenta · Iniciar sesión
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  )
}
