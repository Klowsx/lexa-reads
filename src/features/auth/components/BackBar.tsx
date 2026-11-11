import { BookOpen, ChevronLeft } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

type Props = {
  onBack: () => void
  label?: string
  right?: React.ReactNode
}

// Muestra una barra de regreso con un objetivo táctil accesible y alineación estable.
export function BackBar({ onBack, label, right }: Props) {
  const c = useColors()
  const { t } = useTranslation()

  return (
    <View className="flex-row items-center justify-between px-4 py-2 shrink-0 border-b border-border">
      <Pressable
        onPress={onBack}
        className="w-12 h-12 -ml-1.5 items-center justify-center rounded-full active:bg-sr"
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <ChevronLeft size={22} color={c.text} strokeWidth={1.8} />
      </Pressable>
      <View className="flex-row items-center gap-2">
        <BookOpen size={22} color={c.text} />
        <Text className="text-lg text-text font-display-sb">
          {label ?? 'Lexa'}
        </Text>
      </View>
      <View className="w-12 items-end">{right ?? null}</View>
    </View>
  )
}
