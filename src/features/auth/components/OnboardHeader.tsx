import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

type Props = {
  step: number
  total: number
  onBack?: () => void
  allowSkip?: boolean
  onSkip?: () => void
  disabled?: boolean
}

// Presenta el progreso del onboarding sin mostrar acciones que no estén implementadas.
export function OnboardHeader({
  step,
  total,
  onBack,
  allowSkip = true,
  onSkip,
  disabled
}: Props) {
  const { t } = useTranslation()
  const c = useColors()
  const canSkip = allowSkip && Boolean(onSkip)

  return (
    <View className="flex-row items-center justify-between px-4 py-2 flex-shrink-0">
      {onBack ? (
        <Pressable
          onPress={onBack}
          disabled={disabled}
          className="w-11 h-11 -ml-1.5 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('stitch.authUser.previousStep')}
        >
          <ChevronLeft size={22} color={c.text} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <View className="w-11" />
      )}
      <Text className="font-body text-xs text-t2">
        {t('stitch.authUser.stepProgress', { step, total })}
      </Text>
      {canSkip ? (
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          className="min-h-11 justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('stitch.authUser.skipStep')}
        >
          <Text className="font-body-md text-text text-xs">
            {t('stitch.authUser.skip')}
          </Text>
        </Pressable>
      ) : (
        <View className="w-11" />
      )}
    </View>
  )
}
