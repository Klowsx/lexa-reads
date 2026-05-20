import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({ children, onPress, disabled, loading }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full items-center rounded-md py-[15px] bg-accent ${isDisabled ? 'opacity-35' : ''}`}
    >
      <View className="flex-row items-center gap-2">
        {loading && <ActivityIndicator size="small" color="white" />}
        <Text className="text-white text-sm font-body-sb tracking-wide">
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
