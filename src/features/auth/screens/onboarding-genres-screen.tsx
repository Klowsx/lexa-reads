import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { PrimaryButton } from '~/features/auth/components'
import { useSaveOnboardingPreferences } from '~/features/auth/hooks/useOnboarding'
import { useMe } from '~/features/user/hooks/useMe'
import {
  normalizeProfileGenres,
  PROFILE_GENRES
} from '~/features/user/profile-genres'
import { useColors } from '~/theme/colors'
import { toAppError } from '~/types'
import { OnboardingScreen } from '~/features/auth/components/onboarding-screen'

// Permite elegir géneros y guardar este primer paso antes de continuar.
export default function OnboardGenresScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const c = useColors()
  const { data: profile } = useMe()
  const savePreferences = useSaveOnboardingPreferences()
  const hasHydrated = useRef(false)
  const [selected, setSelected] = useState<string[]>([])

  // Recupera los géneros guardados si la persona cerró la aplicación antes de terminar.
  useEffect(() => {
    if (!profile || hasHydrated.current) return
    setSelected(normalizeProfileGenres(profile.favorite_genres))
    hasHydrated.current = true
  }, [profile])

  // Añade o quita un género de la selección actual.
  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((genre) => genre !== id)
        : [...current, id]
    )
  }

  const error = savePreferences.error
    ? toAppError(savePreferences.error).message
    : undefined

  // Persiste el primer paso antes de avanzar para que el onboarding se pueda reanudar.
  function handleContinue(skip: 'none' | 'genres' | 'all' = 'none') {
    if (!profile || savePreferences.isPending) return

    savePreferences.mutate(
      {
        favoriteGenres:
          skip === 'none' ? selected : (profile.favorite_genres ?? []),
        readingGoal: profile?.reading_goal ?? 12,
        nextStep: skip === 'all' ? 3 : 2
      },
      {
        onSuccess: () =>
          router.push(
            skip === 'all'
              ? '/(auth)/onboarding/username'
              : '/(auth)/onboarding/goal'
          )
      }
    )
  }

  return (
    <OnboardingScreen
      step={1}
      title={t('stitch.authUser.genresTitle')}
      description={t('stitch.authUser.genresIntro')}
      busy={savePreferences.isPending || !profile}
      onSkip={() => handleContinue('genres')}
      footer={
        <>
          <Text className="font-body text-t2 text-xs mb-4">
            {selected.length
              ? t('stitch.authUser.selectedGenres', { count: selected.length })
              : t('stitch.authUser.noRush')}
          </Text>
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
            {t('consent.continue')}
          </PrimaryButton>
          <Pressable
            accessibilityRole="button"
            disabled={!profile || savePreferences.isPending}
            onPress={() => handleContinue('all')}
            className="min-h-12 items-center justify-center mt-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Text className="font-body-md text-text text-sm text-center">
              {t('stitch.authUser.skipPreferences')}
            </Text>
          </Pressable>
        </>
      }
    >
      <View className="flex-row flex-wrap gap-2">
        {PROFILE_GENRES.map((genre) => {
          const selectedGenre = selected.includes(genre)
          return (
            <Pressable
              key={genre}
              onPress={() => toggle(genre)}
              disabled={savePreferences.isPending}
              className="min-h-12 justify-center py-2 px-[14px] rounded-full bg-surface border-[1.5px] border-border"
              style={
                selectedGenre
                  ? {
                      borderColor: c.accent,
                      backgroundColor: c.accent
                    }
                  : undefined
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedGenre }}
              accessibilityLabel={t(`profileGenres.${genre}`, {
                defaultValue: genre
              })}
            >
              <Text
                className="font-body-md text-sm"
                style={{ color: selectedGenre ? c.onAccent : c.t2 }}
              >
                {selectedGenre ? '✓ ' : ''}
                {t(`profileGenres.${genre}`, { defaultValue: genre })}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </OnboardingScreen>
  )
}
