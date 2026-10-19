import { Text, View } from 'react-native';
import { alpha, useColors } from '~/theme/colors';

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
            className="w-11 h-[54px] rounded-[10px] bg-surface items-center justify-center border-[1.5px] border-transparent"
            style={
              isActive ? { borderColor: c.accent }
              : filled ? { borderColor: alpha(c.accent, 0.4) }
              : undefined
            }
          >
            {filled ? (
              <Text className="font-display-sb text-lg text-text">{d}</Text>
            ) : isActive ? (
              <View className="w-[1.5px] h-[22px] opacity-90 bg-accent" />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

