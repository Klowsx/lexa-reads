import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ListRow } from '~/features/lists/list.queries';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const ROTATIONS = [-18, 4, -8];
const OFFSETS = [
  { left: 10, top: 28 },
  { left: 52, top: 48 },
  { left: 88, top: 18 },
];

interface Props {
  lists: ListRow[];
  onPress: (list: ListRow) => void;
  onManage?: () => void;
}

export function FeaturedLists({ lists, onPress, onManage }: Props) {
  const featured = lists.filter((l) => l.is_featured);

  if (featured.length === 0) return null;

  return (
    <View className="mb-5">
      <View className="flex-row justify-between items-baseline px-4 mb-3">
        <Text className="font-body-sb text-xs text-t3 tracking-widest uppercase">
          Destacadas
        </Text>
        {onManage && (
          <Pressable onPress={onManage} hitSlop={6}>
            <Text className="text-xs font-body-sb text-accent">Gestionar</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 2 }}
      >
        {featured.map((list) => {
          const col = list.accent_color ?? '#4A96B8';
          return (
            <Pressable
              key={list.id}
              onPress={() => onPress(list)}
              style={({ pressed }) => ({
                width: 148,
                height: 214,
                borderRadius: 18,
                overflow: 'hidden',
                opacity: pressed ? 0.88 : 1,
                shadowColor: '#000',
                shadowOpacity: 0.55,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 10,
              })}
            >
              {/* Background gradient */}
              <LinearGradient
                colors={[alpha(col, 0.5), col]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                className="absolute inset-0"
              />

              {/* Book cover previews */}
              {list.preview_books.slice(0, 3).map((book, i) => {
                const offset = OFFSETS[i] ?? { left: i * 40, top: 30 };
                const rot = ROTATIONS[i] ?? 0;
                return (
                  <View
                    key={book.id}
                    style={{
                      position: 'absolute',
                      left: offset.left,
                      top: offset.top,
                      transform: [{ rotate: `${rot}deg` }],
                      opacity: 0.72,
                      width: 54,
                      height: 82,
                      borderRadius: 4,
                      overflow: 'hidden',
                      backgroundColor: alpha(col, 0.4),
                    }}
                  >
                    {book.cover_url ? (
                      <Image
                        source={{ uri: book.cover_url }}
                        className="w-[54px] h-[82px]"
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                );
              })}

              {/* Bottom gradient scrim */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.88)']}
                className="absolute inset-0"
              />

              {/* Star badge top-left */}
              <View
                className="absolute top-[9px] left-[9px] w-[26px] h-[26px] rounded-full bg-black/[0.38] items-center justify-center"
              >
                <Star size={12} color="#E8C05A" fill="#E8C05A" strokeWidth={1.5} />
              </View>

              {/* List info bottom */}
              <View
                className="absolute bottom-0 left-0 right-0 p-3"
              >
                <Text
                  className="font-body-sb text-white leading-[18px] mb-[3px]"
                  style={{ fontSize: 13.5 }}
                  numberOfLines={2}
                >
                  {list.name}
                </Text>
                <Text style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.68)' }}>
                  {list.books_count ?? 0} libros
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
