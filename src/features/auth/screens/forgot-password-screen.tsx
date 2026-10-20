import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { AuthField, PrimaryButton } from '~/features/auth/components'
import { AuthPage } from '~/features/auth/components/auth-page'
import { useRequestResetPassword } from '~/features/auth/hooks/useResetPassword'

// Solicita un enlace con mensajes neutros y una vuelta directa al inicio de sesión.
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const { mutate: request, isPending, error } = useRequestResetPassword()
  return (
    <AuthPage
      title="Retoma tus lecturas"
      description="Escribe el correo de tu cuenta. Te enviaremos un enlace para elegir una contraseña nueva."
    >
      <AuthField
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="username"
        autoComplete="email"
      />
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-error text-xs mb-4"
        >
          {error.message}
        </Text>
      )}
      <PrimaryButton
        disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
        loading={isPending}
        onPress={() => request({ email: email.trim() })}
      >
        Enviar enlace
      </PrimaryButton>
      <Link href="/(auth)/login" replace asChild>
        <Pressable className="min-h-12 items-center justify-center mt-4">
          <Text className="font-body-md text-text text-xs">
            Volver a iniciar sesión
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
