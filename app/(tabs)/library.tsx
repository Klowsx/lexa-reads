import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { MY_BOOKS, STATUS_META, type BookStatus, type MockBook, type MockUserBook } from '~/mock';

const TABS: { status: BookStatus; shortLabel: string }[] = [
  { status: 'reading',      shortLabel: 'Leyendo'  },
  { status: 'read',         shortLabel: 'Leídos'   },
  { status: 'want_to_read', shortLabel: 'Por leer' },
  { status: 'abandoned',    shortLabel: 'Abandon.' },
];

// ─── Grid item ────────────────────────────────────────────────

function LibraryItem({
  item,
  itemWidth,
  onPress,
}: {
  item: MockUserBook;
  itemWidth: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mb-3.5 px-1">
      <BookCover book={item.book} width={itemWidth} height={Math.round(itemWidth * 1.52)} />
      <View className="mt-1.5">
        <Text
          className="font-display text-xs text-text leading-tight"
          numberOfLines={2}
        >
          {item.book.title}
        </Text>
        {item.rating != null && (
          <View className="mt-1">
            <StarRating rating={item.rating} size={9} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BookStatus>('reading');
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const shown = MY_BOOKS.filter(ub => ub.status === activeTab);
  // Approximate item width for 3 columns with 16px side padding and 8px gap
  const ITEM_WIDTH = 96;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-2.5 pb-0">
        <Text className="font-display-sb text-xl text-text tracking-tight mb-3">
          Mi biblioteca
        </Text>

        {/* Tab row */}
        <View className="flex-row border-b border-border">
          {TABS.map(({ status, shortLabel }) => {
            const meta = STATUS_META[status];
            const active = activeTab === status;
            const count = MY_BOOKS.filter(ub => ub.status === status).length;

            return (
              <Pressable
                key={status}
                onPress={() => setActiveTab(status)}
                className="flex-1 items-center py-2 pb-2"
                style={{
                  borderBottomWidth: 2,
                  borderBottomColor: active ? meta.color : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'DMSans_600SemiBold',
                    color: active ? meta.color : undefined,
                  }}
                  className={active ? '' : 'text-t3'}
                >
                  {count}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                    color: active ? meta.color : undefined,
                  }}
                  className={active ? '' : 'text-t3'}
                >
                  {shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Book grid */}
      <FlashList
        data={shown}
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            itemWidth={ITEM_WIDTH}
            onPress={() => setSelectedBook(item.book)}
          />
        )}
        numColumns={3}
        keyExtractor={item => String(item.book.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-t3 font-body text-sm">No hay libros en esta lista.</Text>
          </View>
        }
      />

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
