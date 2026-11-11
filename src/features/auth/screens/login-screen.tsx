import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react-native'
import { Link, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { AuthField, PrimaryButton } from '~/features/auth/components'
import { AuthPage } from '~/features/auth/components/auth-page'
import { useColors } from '~/theme/colors'
import { useLogin } from '~/features/auth/hooks/useLogin'

// Permite volver a la biblioteca con correo, contraseña y acceso directo a recuperación.
export default function LoginScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ email?: string }>()
  const c = useColors()
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : ''
  )
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { mutate: login, isPending, error } = useLogin()
  return (
    <AuthPage
      title={t('stitch.authUser.welcomeBack')}
      description={t('stitch.authUser.loginIntro')}
    >
      <AuthField
        label={t('stitch.authUser.email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('stitch.authUser.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="username"
        autoComplete="email"
      />
      <AuthField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        secureTextEntry={!showPw}
        textContentType="password"
        autoComplete="current-password"
        trailing={
          <Pressable
            onPress={() => setShowPw(!showPw)}
            className="w-12 h-12 -mr-3 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={
              showPw
                ? t('changePasswordResult.hide')
                : t('changePasswordResult.show')
            }
          >
            {showPw ? (
              <EyeOff size={20} color={c.text} />
            ) : (
              <Eye size={20} color={c.text} />
            )}
          </Pressable>
        }
      />
      <Link href="/(auth)/forgot-password" asChild>
        <Pressable className="min-h-11 self-end justify-center mb-4">
          <Text className="font-body-md text-text text-sm">
            {t('auth.forgotPassword')}
          </Text>
        </Pressable>
      </Link>
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-error text-xs mb-4"
        >
          {error.message}
        </Text>
      )}
      {error?.message === 'Confirma tu correo antes de iniciar sesión' && (
        <Link
          href={{
            pathname: '/(auth)/confirm-email',
            params: { email: email.trim() }
          }}
          asChild
        >
          <Pressable className="min-h-11 justify-center mb-3">
            <Text className="font-body-md text-text text-sm">
              {t('stitch.authUser.checkConfirmation')}
            </Text>
          </Pressable>
        </Link>
      )}
      <PrimaryButton
        disabled={!email.trim() || !password}
        loading={isPending}
        onPress={() => login({ email: email.trim(), password })}
      >
        {t('auth.login')}
      </PrimaryButton>
      <View className="flex-1 min-h-12" />
      <Text className="font-body text-t2 text-xs text-center">
        {t('stitch.authUser.firstTime')}
      </Text>
      <Link href="/(auth)/register" replace asChild>
        <Pressable className="min-h-12 items-center justify-center">
          <Text className="font-body-sb text-text text-sm">
            {t('stitch.authUser.createAccount')}
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
