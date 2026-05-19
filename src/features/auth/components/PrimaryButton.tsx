import { Pressable, StyleSheet, Text } from 'react-native';
import { AUTH } from './tokens';

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
      style={[styles.btn, disabled && styles.disabled]}
    >
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    backgroundColor: AUTH.accent,
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.1,
  },
});
