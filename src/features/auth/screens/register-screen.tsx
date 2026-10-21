import { Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { AuthField, PrimaryButton } from '~/features/auth/components'
import { useRegister } from '~/features/auth/hooks/useRegister'
import { rawLight, useColors } from '~/theme/colors'
import { AuthPage } from '~/features/auth/components/auth-page'

// Recoge los datos de registro y muestra requisitos claros antes de crear una cuenta.
export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [terms, setTerms] = useState(false)
  const { mutate: register, isPending, error } = useRegister()
  const c = useColors()
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)

  // Abre los documentos legales sin cambiar el estado de aceptación del formulario.
  function handleOpenLegal(path: string) {
    void Linking.openURL(`https://lexareads.app/${path}`)
  }

  return (
    <AuthPage
      title="Empieza tu biblioteca"
      description="Crea tu cuenta. Después podrás elegir tus gustos y tu nombre de lector."
    >
      <AuthField
        label="Nombre"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        icon={User}
      />
      <AuthField
        label="Correo"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        icon={Mail}
      />
      <AuthField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password"
        icon={Lock}
        trailing={
          <Pressable
            onPress={() => setShowPassword((visible) => !visible)}
            className="w-11 h-11 -mr-3 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {showPassword ? (
              <EyeOff size={16} color={c.t3} />
            ) : (
              <Eye size={16} color={c.t3} />
            )}
          </Pressable>
        }
      />

      <View className="mb-6 gap-2">
        <Text className="font-body text-t2 text-xs">
          {hasMinLength ? '✓' : '·'} Al menos 8 caracteres
        </Text>
        <Text className="font-body text-t2 text-xs">
          {hasNumber ? '✓' : '·'} Al menos un número
        </Text>
      </View>

      <View className="mb-[22px]">
        <Pressable
          className="min-h-12 flex-row items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          onPress={() => setTerms((accepted) => !accepted)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: terms }}
          aria-checked={terms}
          accessibilityLabel="Acepto los documentos legales de Lexa"
        >
          <View
            className={`h-5 w-5 rounded-sm border-[1.5px] items-center justify-center ${terms ? 'bg-accent border-accent' : 'border-border'}`}
          >
            {terms && <Check size={11} color={rawLight.text} />}
          </View>
          <Text className="flex-1 text-xs text-t2 font-body">
            He leído y acepto los documentos legales de Lexa.
          </Text>
        </Pressable>
        <View className="flex-row flex-wrap">
          {/* Los enlaces son controles separados para que abrirlos no marque la casilla. */}
          {[
            ['terms', 'Términos'],
            ['eula', 'Licencia de uso'],
            ['privacy', 'Privacidad'],
            ['community', 'Normas de la comunidad']
          ].map(([path, label]) => (
            <Pressable
              key={path}
              onPress={() => handleOpenLegal(path)}
              accessibilityRole="link"
              accessibilityLabel={label}
              className="min-h-11 w-1/2 justify-center rounded-md px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Text className="font-body-sb text-xs text-text underline">
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="text-xs font-body text-center mb-3 text-error"
        >
          {error.message}
        </Text>
      )}

      <PrimaryButton
        disabled={
          !terms ||
          !name.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
          !hasMinLength ||
          !hasNumber
        }
        loading={isPending}
        onPress={() =>
          register({ email: email.trim(), displayName: name.trim(), password })
        }
      >
        Crear cuenta
      </PrimaryButton>

      <Link href="/(auth)/login" replace asChild>
        <Pressable className="pt-[18px] items-center">
          <Text className="text-sm text-t2 font-body">
            ¿Ya tienes cuenta?{' '}
            <Text className="text-accent font-body-sb">Iniciar sesión</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
