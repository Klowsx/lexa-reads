import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { fixed } from '~/theme/colors';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

// Renderiza la acción principal con estados táctiles y feedback de carga explícito.
export function PrimaryButton({ children, onPress, disabled, loading, accessibilityLabel }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="w-full min-h-12 items-center justify-center rounded-md bg-accent"
      style={({ pressed }) => ({ opacity: isDisabled ? 0.42 : pressed ? 0.84 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
    >
      <View className="flex-row items-center gap-2">
        {loading && <ActivityIndicator size="small" color={fixed.onAccent} />}
        <Text className="text-white text-sm font-body-sb tracking-wide">
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
