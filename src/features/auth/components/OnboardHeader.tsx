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
          <Text className="font-sans-light text-text" style={{ fontSize: 26, lineHeight: 26 }}>‹</Text>
        </Pressable>
      ) : (
        <View style={{ width: 32 }} />
      )}
      <Text className="font-sans-sb text-t3 uppercase" style={{ fontSize: 11, letterSpacing: 0.9 }}>
        Paso {step} de {total}
      </Text>
      {allowSkip ? (
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text className="font-sans-medium text-t2 text-sm">Saltar</Text>
        </Pressable>
      ) : (
        <View style={{ width: 32 }} />
      )}
    </View>
  );
}
