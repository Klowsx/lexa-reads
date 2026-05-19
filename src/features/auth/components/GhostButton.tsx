import { Pressable, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
};

export function GhostButton({ children, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-xl py-[14px] bg-transparent border border-border"
    >
      <View className="flex-row items-center justify-center gap-2">{children}</View>
    </Pressable>
  );
}
