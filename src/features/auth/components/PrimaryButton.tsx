import { Pressable, Text } from 'react-native';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ children, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full items-center rounded-md py-[15px] bg-accent ${disabled ? 'opacity-35' : ''}`}
    >
      <Text className="text-white text-sm font-body-sb tracking-wide">
        {children}
      </Text>
    </Pressable>
  );
}
