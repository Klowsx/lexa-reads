import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH } from './tokens';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
};

export function GhostButton({ children, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, style]}>
      <View style={styles.inner}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AUTH.border,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
