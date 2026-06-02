import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { LIST_BOOKS } from '~/mock';
import type { MockList } from '~/mock';
import { useColors } from '~/theme/colors';

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
  lists: MockList[];
  onPress: (list: MockList) => void;
  onManage?: () => void;
}

export function FeaturedLists({ lists, onPress, onManage }: Props) {
  const c = useColors();
  const featured = lists.filter((l) => l.featured);

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
          const books = LIST_BOOKS[list.id] ?? [];
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
                colors={[alpha(list.col, 0.5), list.col]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Scattered book covers */}
              {books.slice(0, 3).map((book, i) => (
                <View
                  key={book.id}
                  style={{
                    position: 'absolute',
                    left: OFFSETS[i].left,
                    top: OFFSETS[i].top,
                    transform: [{ rotate: `${ROTATIONS[i]}deg` }],
                    opacity: 0.72,
                  }}
                >
                  <MockBookCover book={book} width={54} height={82} />
                </View>
              ))}

              {/* Bottom gradient scrim */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.88)']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Star badge top-left */}
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  left: 9,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(0,0,0,0.38)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star size={12} color="#E8C05A" fill="#E8C05A" strokeWidth={1.5} />
              </View>

              {/* List info bottom */}
              <View
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}
              >
                <Text
                  style={{
                    fontSize: 13.5,
                    fontFamily: 'DMSans_600SemiBold',
                    color: '#fff',
                    lineHeight: 18,
                    marginBottom: 3,
                  }}
                  numberOfLines={2}
                >
                  {list.name}
                </Text>
                <Text style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.68)' }}>
                  {books.length} libros
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
