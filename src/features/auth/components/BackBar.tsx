import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AUTH } from './tokens';

type Props = {
  onBack: () => void;
  label?: string;
  right?: React.ReactNode;
};

export function BackBar({ onBack, label, right }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexShrink: 0,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  arrow: {
    fontSize: 26,
    color: AUTH.text,
    lineHeight: 26,
    fontFamily: 'DMSans_300Light',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AUTH.text,
    fontFamily: 'DMSans_600SemiBold',
  },
  right: {
    width: 32,
    alignItems: 'flex-end',
  },
});
