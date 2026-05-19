import { StyleSheet, View } from 'react-native';
import { AUTH } from './tokens';

type Props = { step: number; total: number };

export function StepBar({ step, total }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.seg, i < step && styles.active]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 100,
    backgroundColor: AUTH.sh,
  },
  active: {
    backgroundColor: AUTH.accent,
  },
});
