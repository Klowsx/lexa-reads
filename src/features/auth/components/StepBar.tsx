import { View } from 'react-native'
import { useColors } from '~/theme/colors'

type Props = { step: number; total: number }

export function StepBar({ step, total }: Props) {
  const c = useColors()
  return (
    <View className="flex-row gap-[5px] px-6 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="flex-1 h-[3px] rounded-full bg-sh"
          style={i < step ? { backgroundColor: c.accent } : undefined}
        />
      ))}
    </View>
  )
}
