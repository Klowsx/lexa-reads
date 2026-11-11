import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { PrimaryButton } from '~/features/auth/components'
import { OnboardingScreen } from '~/features/auth/components/onboarding-screen'
import { useFinishOnboarding } from '~/features/auth/hooks/useOnboarding'
import { UserCard } from '~/features/user/components/UserCard'
import { onboardingSuggestionsQueryOptions } from '~/features/user/user.queries'
import { useAuthStore } from '~/stores/auth.store'

// Propone lectores relevantes antes de entrar al feed sin bloquear a quien prefiera decidir después.
export default function OnboardingSuggestionsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const suggestions = useQuery(onboardingSuggestionsQueryOptions(userId))
  const finish = useFinishOnboarding()

  // Persiste el final del onboarding antes de abrir el feed para que el guard no vuelva al paso.
  function finishOnboarding() {
    if (finish.isPending) return
    finish.mutate(undefined, {
      onSuccess: () => router.replace('/(tabs)/feed')
    })
  }

  return (
    <OnboardingScreen
      step={4}
      total={4}
      title={t('stitch.authUser.suggestionsTitle')}
      description={t('stitch.authUser.suggestionsIntro')}
      busy={finish.isPending}
      footer={
        <>
          {finish.isError && (
            <Text
              accessibilityRole="alert"
              className="mb-3 font-body text-xs text-error"
            >
              {t('stitch.authUser.onboardingError')}
            </Text>
          )}
          <PrimaryButton loading={finish.isPending} onPress={finishOnboarding}>
            {t('stitch.authUser.viewFeed')}
          </PrimaryButton>
        </>
      }
    >
      <View className="gap-2">
        {suggestions.isPending && (
          <Text className="font-body text-xs text-t2">
            {t('stitch.authUser.findingReaders')}
          </Text>
        )}
        {suggestions.isError && (
          <Text
            accessibilityRole="alert"
            className="font-body text-xs text-error"
          >
            {t('stitch.authUser.suggestionsError')}
          </Text>
        )}
        {suggestions.data?.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
        {suggestions.data?.length === 0 && !suggestions.isPending && (
          <Text className="font-body text-xs text-t2">
            {t('stitch.authUser.noSuggestions')}
          </Text>
        )}
      </View>
    </OnboardingScreen>
  )
}
