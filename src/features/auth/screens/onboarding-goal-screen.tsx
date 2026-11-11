import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { PrimaryButton } from '~/features/auth/components'
import { useSaveOnboardingPreferences } from '~/features/auth/hooks/useOnboarding'
import { useMe } from '~/features/user/hooks/useMe'
import type { TFunction } from 'i18next'
import { useColors } from '~/theme/colors'
import { toAppError } from '~/types'
import { OnboardingScreen } from '~/features/auth/components/onboarding-screen'

const QUICK_GOALS = [12, 24, 50, 100]

// Describe el ritmo aproximado de una meta anual para que se entienda su alcance.
function getLabel(goal: number, t: TFunction) {
  if (goal === 1) return t('stitch.authUser.annualOne')
  const perMonth = Math.round((goal / 12) * 10) / 10
  const pace =
    goal < 12
      ? t('stitch.authUser.paceCalm')
      : goal < 30
        ? t('stitch.authUser.paceComfort')
        : goal < 60
          ? t('stitch.authUser.paceActive')
          : t('stitch.authUser.paceIntense')
  return t('stitch.authUser.monthlyPace', { count: perMonth, pace })
}

// Permite elegir una meta y guardarla antes de pedir el nombre de usuario.
export default function OnboardGoalScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useColors()
  const { data: profile } = useMe()
  const savePreferences = useSaveOnboardingPreferences()
  const hasHydrated = useRef(false)
  const [goal, setGoal] = useState(12)
  const currentYear = new Date().getFullYear()
  const error = savePreferences.error
    ? toAppError(savePreferences.error).message
    : undefined

  // Recupera la meta intermedia para continuar el onboarding después de reiniciar.
  useEffect(() => {
    if (!profile || hasHydrated.current) return
    setGoal(profile.reading_goal ?? 12)
    hasHydrated.current = true
  }, [profile])

  // Guarda la meta antes del último paso sin borrar los géneros ya elegidos.
  function handleContinue(skip = false) {
    if (!profile || savePreferences.isPending) return

    savePreferences.mutate(
      {
        favoriteGenres: profile?.favorite_genres ?? [],
        readingGoal: skip ? (profile.reading_goal ?? 12) : goal,
        nextStep: 3
      },
      { onSuccess: () => router.push('/(auth)/onboarding/username') }
    )
  }

  return (
    <OnboardingScreen
      step={2}
      title={t('stitch.authUser.goalTitle', { year: currentYear })}
      description={t('stitch.authUser.goalIntro', {
        count: profile?.reading_goal ?? 12
      })}
      onBack={() => router.replace('/(auth)/onboarding/genres')}
      onSkip={() => handleContinue(true)}
      busy={savePreferences.isPending || !profile}
      footer={
        <>
          {error && (
            <Text
              accessibilityLiveRegion="polite"
              className="font-body text-error text-xs mb-3"
            >
              {error}
            </Text>
          )}
          <PrimaryButton
            disabled={!profile}
            loading={savePreferences.isPending}
            onPress={() => handleContinue()}
          >
            {t('stitch.authUser.saveGoal')}
          </PrimaryButton>
        </>
      }
    >
      <View className="flex-row items-center justify-center gap-7 mt-4 mb-9">
        <Pressable
          onPress={() => setGoal((current) => Math.max(1, current - 1))}
          className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('settings.reduceGoal')}
        >
          <Text className="font-body-light text-text text-md leading-7">−</Text>
        </Pressable>

        <View className="items-center min-w-[120px]">
          <Text className="font-display-sb text-[64px] leading-[76px] text-text">
            {goal}
          </Text>
          <Text className="font-body text-t2 mt-1.5 text-xs">
            {t('stitch.authUser.books')}
          </Text>
        </View>

        <Pressable
          onPress={() => setGoal((current) => Math.min(365, current + 1))}
          className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('settings.increaseGoal')}
        >
          <Text className="font-body-light text-text text-md leading-7">+</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap justify-center gap-2">
        {QUICK_GOALS.map((quickGoal) => {
          const selectedGoal = goal === quickGoal
          return (
            <Pressable
              key={quickGoal}
              onPress={() => setGoal(quickGoal)}
              className="min-h-12 justify-center py-2 px-[14px] rounded-full bg-surface border border-border"
              style={
                selectedGoal
                  ? {
                      borderColor: c.accent,
                      backgroundColor: c.accent
                    }
                  : undefined
              }
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedGoal }}
              accessibilityLabel={t('stitch.authUser.bookCount', {
                count: quickGoal
              })}
            >
              <Text
                className="font-body-md text-sm"
                style={{ color: selectedGoal ? c.onAccent : c.t2 }}
              >
                {quickGoal}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Text className="font-body text-t2 text-center mt-7 text-xs leading-6">
        {getLabel(goal, t)}
      </Text>
    </OnboardingScreen>
  )
}
