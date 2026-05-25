import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';
import { alpha } from './tokens';

type Props = { value: string; length?: number };

export function CodeInput({ value, length = 6 }: Props) {
  const c = useColors();
  const digits = value.padEnd(length, ' ').slice(0, length).split('');
  const activeIdx = Math.min(value.length, length - 1);

  return (
    <View className="flex-row gap-2 justify-center">
      {digits.map((d, i) => {
        const isActive = i === activeIdx && value.length < length;
        const filled = d !== ' ';
        return (
          <View
            key={i}
            className="w-11 h-[54px] rounded-[10px] bg-surface items-center justify-center"
            style={[
              styles.cellBorder,
              isActive && { borderColor: c.accent },
              filled && !isActive && { borderColor: alpha(c.accent, 0.4) },
            ]}
          >
            {filled ? (
              <Text className="font-display-sb text-text" style={styles.digitSize}>{d}</Text>
            ) : isActive ? (
              <View style={[styles.cursor, { backgroundColor: c.accent }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cellBorder: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  digitSize: {
    fontSize: 24,
  },
  cursor: {
    width: 1.5,
    height: 22,
    opacity: 0.9,
  },
});
