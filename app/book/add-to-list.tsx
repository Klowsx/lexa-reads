import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Plus } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserLists } from '~/features/lists/hooks/useUserLists';
import { useAddBookToList } from '~/features/lists/hooks/useAddBookToList';
import type { ListRow } from '~/features/lists/list.queries';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

function ListRow({
  list,
  added,
  isPending,
  onToggle,
}: {
  list: ListRow;
  added: boolean;
  isPending: boolean;
  onToggle: () => void;
}) {
  const c = useColors();
  const col = list.accent_color ?? '#4A96B8';

  return (
    <Pressable
      onPress={onToggle}
      disabled={isPending}
      className="flex-row items-center gap-3 px-4 py-3.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.sh : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        opacity: isPending ? 0.6 : 1,
      })}
    >
      {/* Color stripe */}
      <View className="rounded-sm shrink-0 w-[3.5px] h-9 opacity-[0.85]" style={{ backgroundColor: col }} />

      {/* Info */}
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-body-sb text-text" numberOfLines={1}>{list.name}</Text>
        <Text className="text-xs font-body text-t3 mt-0.5">
          {list.books_count} libros · {list.visibility === 'public' ? 'Pública' : 'Privada'}
        </Text>
      </View>

      {/* Toggle */}
      {isPending ? (
        <ActivityIndicator size="small" color={c.accent} />
      ) : (
        <View
          className={cn("w-6 h-6 rounded-full items-center justify-center", added ? "bg-accent" : "bg-transparent border-[1.5px] border-border")}
        >
          {added && <Check size={13} color="#fff" strokeWidth={2.5} />}
        </View>
      )}
    </Pressable>
  );
}

export default function AddToListScreen() {
  const { bookId, bookTitle, listSlug } = useLocalSearchParams<{
    bookId?: string;
    bookTitle?: string;
    listSlug?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const { data: lists = [], isLoading } = useUserLists();
  const addMutation = useAddBookToList();

  // Track which lists have been added during this session
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleToggle(list: ListRow) {
    if (!bookId || addedIds.has(list.id) || pendingId) return;
    setPendingId(list.id);
    addMutation.mutate(
      { listId: list.id, bookId, position: list.books_count },
      {
        onSuccess: () => {
          setAddedIds((prev) => new Set([...prev, list.id]));
          setPendingId(null);
        },
        onError: () => setPendingId(null),
      },
    );
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
          <Text className="font-display-sb text-xl text-text tracking-tight">Agregar a lista</Text>
          {bookTitle ? (
            <Text className="text-xs font-body text-t3" numberOfLines={1}>{bookTitle}</Text>
          ) : null}
        </View>
        {addedCount > 0 && (
          <Pressable
            onPress={() => router.back()}
            className="px-3.5 py-2 rounded-full"
            style={{ backgroundColor: alpha(c.accent, 0.12) }}
          >
            <Text className="text-xs font-body-sb text-accent">Listo</Text>
          </Pressable>
        )}
      </View>

      {/* Create new list CTA */}
      <Pressable
        onPress={() => router.push('/list/new' as any)}
        className="flex-row items-center gap-3 px-4 py-3.5 border-b border-border"
        style={({ pressed }) => ({ backgroundColor: pressed ? c.sh : alpha(c.accent, 0.04) })}
      >
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: alpha(c.accent, 0.14) }}
        >
          <Plus size={16} color={c.accent} strokeWidth={2} />
        </View>
        <Text className="text-sm font-body-md text-accent">Nueva lista</Text>
      </Pressable>

      {/* Loading */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.accent} />
        </View>
      )}

      {/* Lists */}
      {!isLoading && (
        <FlashList
          data={lists}
          renderItem={({ item }) => (
            <ListRow
              list={item}
              added={addedIds.has(item.id)}
              isPending={pendingId === item.id}
              onToggle={() => handleToggle(item)}
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
      )}
    </View>
  );
}
