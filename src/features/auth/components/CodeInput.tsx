import { StyleSheet, Text, View } from 'react-native';
import { AUTH, alpha } from './tokens';

type Props = { value: string; length?: number };

export function CodeInput({ value, length = 6 }: Props) {
  const digits = value.padEnd(length, ' ').slice(0, length).split('');
  const activeIdx = Math.min(value.length, length - 1);

  return (
    <View style={styles.row}>
      {digits.map((d, i) => {
        const isActive = i === activeIdx && value.length < length;
        const filled = d !== ' ';
        return (
          <View
            key={i}
            style={[
              styles.cell,
              isActive && { borderColor: AUTH.accent },
              filled && !isActive && { borderColor: alpha(AUTH.accent, 0.4) },
            ]}
          >
            {filled ? (
              <Text style={styles.digit}>{d}</Text>
            ) : isActive ? (
              <View style={styles.cursor} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  cell: {
    width: 44,
    height: 54,
    borderRadius: 10,
    backgroundColor: AUTH.surface,
    borderWidth: 1.5,
    borderColor: AUTH.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 24,
    color: AUTH.text,
  },
  cursor: {
    width: 1.5,
    height: 22,
    backgroundColor: AUTH.accent,
    opacity: 0.9,
  },
});
