import { Pressable, Text, View } from 'react-native';

type Props = {
  onBack: () => void;
  label?: string;
  right?: React.ReactNode;
};

export function BackBar({ onBack, label, right }: Props) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 shrink-0">
      <Pressable onPress={onBack} className="p-1.5 -ml-1.5" hitSlop={8}>
        <Text className="text-[26px] text-text leading-[26px] font-body-light">‹</Text>
      </Pressable>
      {label && <Text className="text-sm text-text font-body-sb">{label}</Text>}
      <View className="w-8 items-end">{right ?? null}</View>
    </View>
  );
}
