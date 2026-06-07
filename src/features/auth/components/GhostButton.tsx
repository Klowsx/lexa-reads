import { ActivityIndicator, Pressable, View } from 'react-native';
import { useColors } from '~/theme/colors';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function GhostButton({ children, onPress, loading, disabled }: Props) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className="flex-1 rounded-xl py-[14px] bg-transparent border border-border disabled:opacity-60"
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? <ActivityIndicator size="small" color={c.text} /> : children}
      </View>
    </Pressable>
  );
}
