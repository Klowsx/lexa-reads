import { Text, View } from 'react-native';
import { fixed } from '~/theme/colors';

const STAR = fixed.star;

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface StarRatingProps {
  rating: number | null;
  size?: number;
}

export function StarRating({ rating, size = 12 }: StarRatingProps) {
  if (rating == null) return null;

  return (
    <View className="flex-row gap-px">
      {[1, 2, 3, 4, 5].map(i => {
        const full = rating >= i;
        const half = !full && rating >= i - 0.5;
        return (
          <View key={i} style={{ width: size, height: size, position: 'relative' }}>
            <Text
              style={{
                position: 'absolute',
                fontSize: size,
                lineHeight: size * 1.15,
                color: alpha(STAR, 0.22),
              }}
            >
              ★
            </Text>
            {(full || half) && (
              <View
                style={{
                  position: 'absolute',
                  width: half ? '50%' : '100%',
                  height: size,
                  overflow: 'hidden',
                }}
              >
                <Text style={{ fontSize: size, lineHeight: size * 1.15, color: STAR }}>★</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
