import { Check, Eye, EyeOff, Lock } from 'lucide-react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useUpdatePassword } from '~/features/auth/hooks/useResetPassword'
import { Pressable, Text, View } from 'react-native'
import { AuthField, PrimaryButton, alpha } from '~/features/auth/components'
import { useColors } from '~/theme/colors'
import { AuthPage } from '~/features/auth/components/auth-page'
import { useAuthStore } from '~/stores/auth.store'

const REQUIREMENTS = [
  { label: 'Al menos 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Contiene un número', test: (pw: string) => /\d/.test(pw) },
  {
    label: 'Las contraseñas coinciden',
    test: (_: string, pw2: string) => _ !== '' && _ === pw2
  }
]

// Permite definir una contraseña nueva con controles visibles y requisitos verificables.
export default function NewPasswordScreen() {
  const c = useColors()
  const router = useRouter()
  const session = useAuthStore((state) => state.session)
  const isRecoveryMode = useAuthStore((state) => state.isRecoveryMode)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)

  const {
    mutate: updatePassword,
    isPending,
    error,
    passwordUpdated
  } = useUpdatePassword()

  const allMet = REQUIREMENTS.every(({ test }) => test(password, confirm))

  // El cierre puede reintentarse sin volver a enviar una contraseña que ya fue guardada.
  if (passwordUpdated)
    return (
      <AuthPage
        title="Tu contraseña está actualizada"
        description="Estamos cerrando la sesión temporal para que vuelvas a entrar con tu contraseña nueva."
      >
        {error && (
          <Text
            accessibilityLiveRegion="polite"
            className="font-body text-xs text-error mb-4"
          >
            La contraseña cambió, pero falta cerrar la sesión. Vuelve a
            intentarlo.
          </Text>
        )}
        <PrimaryButton
          loading={isPending}
          onPress={() => updatePassword({ password })}
        >
          Finalizar recuperación
        </PrimaryButton>
      </AuthPage>
    )

  // Un acceso directo o una sesión vencida nunca muestran el formulario de cambio.
  if (!session || !isRecoveryMode)
    return (
      <AuthPage
        title="Necesitas un enlace válido"
        description="Solicita un nuevo enlace de recuperación para elegir tu contraseña."
      >
        <PrimaryButton
          onPress={() => router.replace('/(auth)/forgot-password')}
        >
          Solicitar recuperación
        </PrimaryButton>
      </AuthPage>
    )

  return (
    <AuthPage
      title="Una contraseña nueva"
      description="Usa una contraseña que no utilices en otras cuentas. Al guardarla, volverás a iniciar sesión."
    >
      <AuthField
        label="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!show}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password"
        icon={Lock}
        trailing={
          <Pressable
            onPress={() => setShow(!show)}
            className="w-11 h-11 -mr-3 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={
              show ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {show ? (
              <EyeOff size={16} color={c.t3} />
            ) : (
              <Eye size={16} color={c.t3} />
            )}
          </Pressable>
        }
      />

      <AuthField
        label="Confirmar contraseña"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry={!show}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password"
        icon={Lock}
        trailing={
          password && password === confirm ? (
            <Check size={16} color={c.success} />
          ) : undefined
        }
      />

      <View className="rounded-[10px] bg-sr border border-border mt-1 mb-[22px] p-3 gap-1">
        {REQUIREMENTS.map(({ label, test }) => {
          const ok = test(password, confirm)
          return (
            <View key={label} className="flex-row items-center gap-2 py-1">
              {ok ? (
                <View
                  className="w-4 h-4 rounded-full items-center justify-center"
                  style={{ backgroundColor: alpha(c.success, 0.18) }}
                >
                  <Check size={10} color={c.success} />
                </View>
              ) : (
                <View className="w-4 h-4 rounded-full bg-sh items-center justify-center">
                  <View className="w-1 h-1 rounded-full bg-t3" />
                </View>
              )}
              <Text
                className={`font-body text-xs ${ok ? 'text-text' : 'text-t2'}`}
              >
                {label}
              </Text>
            </View>
          )
        })}
      </View>

      {error && (
        <Text className="font-body text-error text-xs text-center mb-3">
          {error.message}
        </Text>
      )}
      <PrimaryButton
        disabled={!allMet}
        loading={isPending}
        onPress={() => updatePassword({ password })}
      >
        Guardar contraseña
      </PrimaryButton>
    </AuthPage>
  )
}
