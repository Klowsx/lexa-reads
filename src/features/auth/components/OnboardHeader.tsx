import { Pressable, Text, View } from 'react-native';

type Props = {
  step: number;
  total: number;
  onBack?: () => void;
  allowSkip?: boolean;
  onSkip?: () => void;
};

export function OnboardHeader({ step, total, onBack, allowSkip = true, onSkip }: Props) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 flex-shrink-0">
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} className="p-1.5 -ml-1.5 w-8">
          <Text className="font-body-light text-lg text-text leading-[26px]">‹</Text>
        </Pressable>
      ) : (
        <View className="w-8" />
      )}
      <Text className="font-body-sb text-xs text-t3 uppercase tracking-wide">
        Paso {step} de {total}
      </Text>
      {allowSkip ? (
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text className="font-body-md text-t2 text-sm">Saltar</Text>
        </Pressable>
      ) : (
        <View className="w-8" />
      )}
    </View>
  );
}
