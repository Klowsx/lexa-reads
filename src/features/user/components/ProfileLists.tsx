import { ChevronRight, Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useColors } from '~/theme/colors';
import type { ListRow } from '~/features/lists/list.queries';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const GOLD = '#E8C05A';

interface Props {
  lists: ListRow[];
  onNewList?: () => void;
  onPress?: (list: ListRow) => void;
  onToggleFeatured?: (id: string) => void;
  title?: string;
}

export function ProfileLists({
  lists,
  onNewList,
  onPress,
  onToggleFeatured,
  title = 'Mis listas',
}: Props) {
  const c = useColors();

  return (
    <View className="px-4 pb-7">
      <View className="flex-row justify-between items-baseline mb-2.5">
        <Text className="font-body-sb text-xs text-t3 tracking-widest uppercase">
          {title}
        </Text>
        {onNewList && (
          <Pressable onPress={onNewList} hitSlop={6}>
            <Text className="text-xs font-body-sb text-accent">+ Nueva</Text>
          </Pressable>
        )}
      </View>

      {lists.length === 0 && (
        <View className="py-6 items-center">
          <Text className="text-xs font-body text-t3">Sin listas todavía.</Text>
        </View>
      )}

      <View className="gap-2">
        {lists.map((list) => {
          const col = list.accent_color ?? '#4A96B8';
          const isFeatured = list.is_featured ?? false;
          return (
            <Pressable
              key={list.id}
              onPress={() => onPress?.(list)}
              className="flex-row items-center gap-3 px-3.5 py-3 rounded-md bg-surface"
              style={({ pressed }) => ({
                backgroundColor: pressed ? c.sh : c.surface,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderTopColor: isFeatured ? alpha(col, 0.35) : c.border,
                borderBottomColor: isFeatured ? alpha(col, 0.18) : c.border,
                borderLeftColor: isFeatured ? alpha(col, 0.25) : c.border,
                borderRightColor: isFeatured ? alpha(col, 0.18) : c.border,
              })}
            >
              {/* Color stripe */}
              <View
                className="shrink-0 rounded-sm"
                style={{ width: 3.5, height: 36, backgroundColor: col, opacity: 0.85 }}
              />

              {/* Name + meta */}
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
                    {list.name}
                  </Text>
                  {isFeatured && (
                    <Star size={11} color={GOLD} fill={GOLD} strokeWidth={1.5} />
                  )}
                </View>
                <Text className="text-xs font-body text-t3 mt-0.5">
                  {list.books_count ?? 0} libros · {list.visibility === 'public' ? 'Pública' : 'Privada'}
                </Text>
              </View>

              {/* Star toggle */}
              {onToggleFeatured && (
                <Pressable
                  onPress={() => onToggleFeatured(list.id)}
                  hitSlop={8}
                  className="p-1.5"
                >
                  <Star
                    size={16}
                    color={isFeatured ? GOLD : c.t3}
                    fill={isFeatured ? GOLD : 'transparent'}
                    strokeWidth={1.8}
                  />
                </Pressable>
              )}

              <ChevronRight size={16} color={c.t3} strokeWidth={1.6} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
