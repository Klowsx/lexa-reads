import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native'
import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  AuthField,
  BackBar,
  GhostButton,
  PrimaryButton
} from '../../src/features/auth/components'
import { useColors } from '~/theme/colors'
import { useLogin } from '@/src/features/auth/hooks/useLogin'

// Presenta el acceso a Lexa con campos accesibles y acciones disponibles de forma explícita.
export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const { mutate: login, isPending, error } = useLogin()

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
        <View className="mb-7">
          <Text className="font-display-sb text-text text-2xl">
            {'Bienvenido\nde vuelta'}
          </Text>
          <Text className="font-body text-t2 text-sm mt-[10px]">
            Continúa donde lo dejaste.
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
        <AuthField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPw}
          textContentType="password"
          autoComplete="current-password"
          icon={Lock}
          trailing={
            <Pressable
              onPress={() => setShowPw(!showPw)}
              className="w-11 h-11 -mr-3 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel={
                showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
            >
              {showPw ? (
                <EyeOff size={16} color={c.t3} />
              ) : (
                <Eye size={16} color={c.t3} />
              )}
            </Pressable>
          }
        />

        <View className="items-end -mt-1 mb-[22px]">
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable>
              <Text className="font-body-md text-xs text-accent">
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          </Link>
        </View>

        {error && (
          <Text className="text-xs font-body text-center mb-3 text-error">
            {error.message}
          </Text>
        )}

        <PrimaryButton
          loading={isPending}
          onPress={() => login({ email, password })}
        >
          Iniciar sesión
        </PrimaryButton>

        <View className="flex-row items-center gap-[10px] my-[22px]">
          <View className="flex-1 h-px bg-border" />
          <Text className="font-body text-xs text-t3 uppercase tracking-[0.9px]">
            o continúa con
          </Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <View className="flex-row mb-2">
          <GhostButton
            disabled
            accessibilityLabel="Inicio de sesión con Google, próximamente"
          >
            <GoogleIcon />
            <Text className="font-body-md text-text text-sm">
              Google próximamente
            </Text>
          </GhostButton>
        </View>

        <View className="flex-1" />

        <Link href="/(auth)/register" asChild>
          <Pressable className="pt-[18px] items-center">
            <Text className="font-body text-t2 text-sm">
              ¿No tienes cuenta?{' '}
              <Text className="font-body-sb text-accent">Crear una</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function GoogleIcon() {
  return (
    <View style={googleStyles.svg}>
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: '#4285F4', top: 0, left: '50%' }
        ]}
      />
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: '#34A853', bottom: 0, left: '50%' }
        ]}
      />
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: '#FBBC04', bottom: 0, left: 0 }
        ]}
      />
      <View
        style={[
          googleStyles.quarter,
          { backgroundColor: '#EA4335', top: 0, left: 0 }
        ]}
      />
      <View
        className="bg-surface absolute rounded-[3.5px]"
        style={googleStyles.hole}
      />
    </View>
  )
}

const googleStyles = StyleSheet.create({
  svg: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative'
  },
  quarter: {
    position: 'absolute',
    width: '50%',
    height: '50%'
  },
  hole: {
    width: 7,
    height: 7,
    top: 3.5,
    left: 3.5
  }
})
