import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { MockBookCover } from '~/components/ui/MockBookCover';
import type { MockBook, MockUserBook } from '~/mock';
import { READING_PROGRESS } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface Props {
  books: MockUserBook[];
  onPress: (book: MockBook) => void;
}

export function CurrentlyReading({ books, onPress }: Props) {
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      delay: 350,
      useNativeDriver: false,
    }).start();
  }, []);

  if (books.length === 0) return null;

  return (
    <View className="px-4 mb-5">
      <Text className="font-body-sb text-xs text-t3 tracking-widest mb-2.5 uppercase">
        Leyendo ahora
      </Text>

      <View className="gap-2.5">
        {books.map(({ book }) => {
          const prog = READING_PROGRESS[book.id];
          const pct = prog ? prog.current / prog.total : null;

          return (
            <Pressable
              key={book.id}
              onPress={() => onPress(book)}
              className="flex-row gap-3.5 p-3.5 bg-surface rounded-lg overflow-hidden border"
              style={{
                borderTopColor: alpha(c.status.reading, 0.3),
                borderBottomColor: alpha(c.status.reading, 0.15),
                borderLeftColor: alpha(c.status.reading, 0.15),
                borderRightColor: alpha(c.status.reading, 0.15),
              }}
            >
              <View
                className="absolute top-0 left-0 right-0"
                style={{ height: 2.5, backgroundColor: c.status.reading, opacity: 0.85 }}
              />

              <MockBookCover book={book} width={62} height={93} />

              <View className="flex-1 justify-between pt-0.5">
                <View>
                  <Text className="font-display-sb text-sm text-text mb-1" numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text className="text-xs font-body text-t2">{book.author}</Text>
                </View>

                {pct !== null ? (
                  <View>
                    <View className="h-1 rounded-full bg-sh overflow-hidden mb-1.5">
                      <Animated.View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: c.status.reading,
                          width: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['2%', `${Math.round(pct * 100)}%`],
                          }),
                        }}
                      />
                    </View>
                    <Text className="text-xs font-body text-t3">
                      {'Pág. '}
                      <Text className="font-body-md text-t2">{prog!.current}</Text>
                      {` de ${prog!.total} · `}
                      <Text className="font-body-sb" style={{ color: c.status.reading }}>
                        {Math.round(pct * 100)}%
                      </Text>
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs font-body text-t3">
                    Sin progreso · toca para registrar
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
