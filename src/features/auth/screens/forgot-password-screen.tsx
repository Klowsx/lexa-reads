import { useTranslation } from 'react-i18next'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { AuthField, PrimaryButton } from '~/features/auth/components'
import { AuthPage } from '~/features/auth/components/auth-page'
import { useRequestResetPassword } from '~/features/auth/hooks/useResetPassword'

// Solicita un enlace con mensajes neutros y una vuelta directa al inicio de sesión.
export default function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const { mutate: request, isPending, error } = useRequestResetPassword()
  return (
    <AuthPage
      title={t('stitch.authUser.resumeReading')}
      description={t('stitch.authUser.recoveryIntro')}
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
        {t('stitch.authUser.sendLink')}
      </PrimaryButton>
      <Link href="/(auth)/login" replace asChild>
        <Pressable className="min-h-12 items-center justify-center mt-4">
          <Text className="font-body-md text-text text-sm">
            {t('stitch.authUser.backLogin')}
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
