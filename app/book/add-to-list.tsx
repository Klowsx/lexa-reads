import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_LISTS, type MockList } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

function ListRow({
  list,
  added,
  onToggle,
}: {
  list: MockList;
  added: boolean;
  onToggle: () => void;
}) {
  const c = useColors();

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center gap-3 px-4 py-3.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.sh : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      })}
    >
      {/* Color stripe */}
      <View
        className="rounded-sm shrink-0"
        style={{ width: 3.5, height: 36, backgroundColor: list.col, opacity: 0.85 }}
      />

      {/* Info */}
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
          {list.name}
        </Text>
        <Text className="text-xs font-body text-t3 mt-0.5">
          {list.count} libros · {list.visibility}
        </Text>
      </View>

      {/* Toggle */}
      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{
          backgroundColor: added ? c.accent : 'transparent',
          borderWidth: added ? 0 : 1.5,
          borderColor: c.border,
        }}
      >
        {added && <Check size={13} color="#fff" strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
}

export default function AddToListScreen() {
  const { bookId, bookTitle } = useLocalSearchParams<{
    bookId: string;
    bookTitle?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  // Start with no lists selected
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  function toggleList(id: string) {
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const addedCount = addedIds.size;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <Text className="font-display-sb text-xl text-text tracking-tight">
            Agregar a lista
          </Text>
          {bookTitle ? (
            <Text className="text-xs font-body text-t3" numberOfLines={1}>
              {bookTitle}
            </Text>
          ) : null}
        </View>
        {addedCount > 0 && (
          <Pressable
            onPress={() => router.back()}
            className="px-3.5 py-2 rounded-full"
            style={{ backgroundColor: alpha(c.accent, 0.12) }}
          >
            <Text className="text-xs font-body-sb" style={{ color: c.accent }}>
              Listo
            </Text>
          </Pressable>
        )}
      </View>

      {/* Create new list CTA */}
      <Pressable
        onPress={() => router.push('/list/new' as any)}
        className="flex-row items-center gap-3 px-4 py-3.5 border-b border-border"
        style={({ pressed }) => ({
          backgroundColor: pressed ? c.sh : alpha(c.accent, 0.04),
        })}
      >
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: alpha(c.accent, 0.14) }}
        >
          <Plus size={16} color={c.accent} strokeWidth={2} />
        </View>
        <Text className="text-sm font-body-md" style={{ color: c.accent }}>
          Nueva lista
        </Text>
      </Pressable>

      {/* Lists */}
      <FlashList
        data={MOCK_LISTS}
        renderItem={({ item }) => (
          <ListRow
            list={item}
            added={addedIds.has(item.id)}
            onToggle={() => toggleList(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-xs font-body text-t3">No tienes listas todavía.</Text>
          </View>
        }
      />
    </View>
  );
}
