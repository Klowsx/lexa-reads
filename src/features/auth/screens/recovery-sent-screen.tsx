import { useTranslation } from 'react-i18next'
import { Link, useLocalSearchParams } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { PrimaryButton } from '~/features/auth/components'
import { AuthPage } from '~/features/auth/components/auth-page'
import { useResendCountdown } from '~/features/auth/hooks/use-resend-countdown'
import { useResendPasswordRecoveryLink } from '~/features/auth/hooks/useResetPassword'

// Explica el siguiente paso del enlace de recuperación y permite reenviarlo con una espera visible.
export default function RecoverySentScreen() {
  const { t } = useTranslation()
  const { email } = useLocalSearchParams<{ email: string }>()
  const { seconds: countdown, restart } = useResendCountdown()
  const { mutate: resend, isPending, error } = useResendPasswordRecoveryLink()

  // Solicita un nuevo enlace solo cuando el contador y la petición actual lo permiten.
  function handleResend() {
    if (!email || countdown > 0 || isPending) return
    resend({ email }, { onSuccess: restart })
  }

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')

  return (
    <AuthPage
      title={t('stitch.authUser.checkEmail')}
      description={t('stitch.authUser.recoverySentIntro')}
    >
      <View className="rounded-[10px] bg-sr border border-border p-4 mb-6">
        <Text selectable className="font-body-md text-text text-sm">
          {email || t('stitch.authUser.missingRecoveryEmail')}
        </Text>
      </View>

      <Text className="font-body text-t2 text-xs leading-6 mb-6">
        {t('stitch.authUser.recoverySentHint')}
      </Text>

      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-error text-xs mb-4"
        >
          {error.message}
        </Text>
      )}

      {countdown > 0 ? (
        <Text className="font-body text-t2 text-center text-xs mb-6">
          {t('stitch.authUser.resendInPrefix')}{' '}
          <Text className="font-body-md text-text">
            {mm}:{ss}
          </Text>
        </Text>
      ) : (
        <PrimaryButton
          loading={isPending}
          disabled={!email}
          onPress={handleResend}
        >
          {t('stitch.authUser.resendLink')}
        </PrimaryButton>
      )}

      <Link href="/(auth)/forgot-password" replace asChild>
        <Pressable className="min-h-12 items-center justify-center mt-4">
          <Text className="font-body-md text-text text-sm">
            {t('stitch.authUser.anotherEmail')}
          </Text>
        </Pressable>
      </Link>
    </AuthPage>
  )
}
