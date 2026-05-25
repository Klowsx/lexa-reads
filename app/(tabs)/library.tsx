import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { LibraryItem } from '~/features/library/components/LibraryItem';
import { LibraryTabs } from '~/features/library/components/LibraryTabs';
import { type BookStatus } from '~/lib/book-status';
import { MY_BOOKS, type MockBook } from '~/mock';

const ITEM_WIDTH = 96;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BookStatus>('reading');
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const shown = MY_BOOKS.filter((ub) => ub.status === activeTab);

  const countByStatus = {
    reading:      MY_BOOKS.filter((ub) => ub.status === 'reading').length,
    read:         MY_BOOKS.filter((ub) => ub.status === 'read').length,
    want_to_read: MY_BOOKS.filter((ub) => ub.status === 'want_to_read').length,
    abandoned:    MY_BOOKS.filter((ub) => ub.status === 'abandoned').length,
  } satisfies Record<BookStatus, number>;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-2.5 pb-0">
        <Text className="font-display-sb text-xl text-text tracking-tight mb-3">
          Mi biblioteca
        </Text>
        <LibraryTabs
          activeTab={activeTab}
          countByStatus={countByStatus}
          onTabChange={setActiveTab}
        />
      </View>

      <FlashList
        data={shown}
        numColumns={3}
        keyExtractor={(item) => String(item.book.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            itemWidth={ITEM_WIDTH}
            onPress={() => setSelectedBook(item.book)}
          />
        )}
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
