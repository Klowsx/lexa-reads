import { useTranslation } from 'react-i18next'
import { Link, useLocalSearchParams } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { AuthPage } from '~/features/auth/components/auth-page'
import { PrimaryButton } from '~/features/auth/components/PrimaryButton'
import { useResendConfirmation } from '~/features/auth/hooks/use-resend-confirmation'
import { useResendCountdown } from '~/features/auth/hooks/use-resend-countdown'

// Explica la confirmación de una cuenta nueva y permite reenviar sin perder el contexto.
export default function ConfirmEmailScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ email?: string }>()
  const email = typeof params.email === 'string' ? params.email : ''
  const resend = useResendConfirmation()
  const countdown = useResendCountdown()
  return (
    <AuthPage
      title={t('stitch.authUser.checkInbox')}
      description={t('stitch.authUser.confirmationIntro')}
    >
      <View className="bg-surface rounded-md p-5 mb-6">
        <Text className="font-body text-t2 text-xs mb-2">
          {t('stitch.authUser.accountEmail')}
        </Text>
        <Text selectable className="font-body-md text-text text-sm">
          {email || 'Vuelve al registro para indicar tu correo.'}
        </Text>
      </View>
      <Link
        href={{ pathname: '/(auth)/login', params: { email } }}
        replace
        asChild
      >
        <PrimaryButton>{t('stitch.authUser.confirmedLogin')}</PrimaryButton>
      </Link>
      <Pressable
        accessibilityRole="button"
        disabled={!email || countdown.seconds > 0 || resend.isPending}
        className="min-h-12 items-center justify-center mt-3"
        onPress={() => resend.mutate(email, { onSuccess: countdown.restart })}
      >
        <Text className="font-body-md text-t2 text-xs">
          {resend.isPending
            ? t('stitch.authUser.resending')
            : countdown.seconds > 0
              ? t('stitch.authUser.resendSeconds', { count: countdown.seconds })
              : t('stitch.authUser.resendConfirmation')}
        </Text>
      </Pressable>
      {resend.error && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-error text-xs mt-3"
        >
          {resend.error.message}
        </Text>
      )}
      {resend.isSuccess && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-text text-xs mt-3"
        >
          {t('stitch.authUser.requestSent')}
        </Text>
      )}
      <View className="flex-1 min-h-8" />
      <Link href="/(auth)/register" replace asChild>
        <Pressable className="min-h-12 items-center justify-center">
          <Text className="font-body text-text text-xs">
            {t('stitch.authUser.wrongEmail')}
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
