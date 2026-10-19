import { KeyRound, Mail } from 'lucide-react-native'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  AuthField,
  BackBar,
  PrimaryButton,
  alpha
} from '../../src/features/auth/components'
import { useColors } from '~/theme/colors'
import { useRequestResetPassword } from '@/src/features/auth/hooks/useResetPassword'

// Solicita un código de recuperación manteniendo el formulario visible al abrir el teclado.
export default function ForgotPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [email, setEmail] = useState('')

  const { mutate: request, isPending, error } = useRequestResetPassword()
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 24
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mt-4 mb-[22px]">
          <View
            className="w-18 h-18 rounded-lg items-center justify-center border"
            style={{
              backgroundColor: alpha(c.accent, 0.12),
              borderColor: alpha(c.accent, 0.3)
            }}
          >
            <KeyRound size={32} color={c.accent} />
          </View>
        </View>

        <View className="items-center mb-7 px-2">
          <Text className="font-display-sb text-text text-center text-2xl tracking-[-0.3px]">
            Recupera tu cuenta
          </Text>
          <Text className="font-body text-t2 text-sm mt-2.5 text-center leading-5">
            Ingresa tu correo y te enviaremos un código para restablecer tu
            contraseña.
          </Text>
        </View>

        <AuthField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="username"
          autoComplete="email"
          icon={Mail}
        />
        {error && (
          <Text
            className="text-xs font-body text-center mb-3 text-error"
            accessibilityLiveRegion="polite"
          >
            {error.message}
          </Text>
        )}
        <View className="mt-[14px]">
          <PrimaryButton loading={isPending} onPress={() => request({ email })}>
            Enviar código
          </PrimaryButton>
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="font-body text-t2 text-sm">
              ¿Lo recordaste?{' '}
              <Text className="font-body-sb text-accent">Iniciar sesión</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
