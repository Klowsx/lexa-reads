import { Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { BOOKS, type MockBook } from '~/mock';
import { useColors } from '~/lib/colors';

const GENRES = ['Fantasía', 'Realismo mágico', 'Dark Academia', 'Memorias', 'Ciencia ficción', 'Misterio', 'Romance'];

// ─── Book result card ─────────────────────────────────────────

function BookCard({ book, onPress }: { book: MockBook; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 p-3 bg-surface rounded-md border border-border mb-2.5"
    >
      <BookCover book={book} width={44} height={66} />
      <View className="flex-1 min-w-0">
        <Text className="font-display-sb text-sm text-text leading-tight mb-0.5" numberOfLines={2}>
          {book.title}
        </Text>
        <Text className="font-body text-sm text-t2 mb-1.5">{book.author}</Text>
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <StarRating rating={book.avg} size={10} />
          <Text className="text-xs text-t3 font-body">
            {book.avg} · {book.pages}p
          </Text>
        </View>
        <View className="flex-row gap-1 flex-wrap">
          {book.genres.slice(0, 2).map(g => (
            <Text key={g} className="text-xs font-body text-t3 px-1.5 py-0.5 bg-sh rounded-sm">
              {g}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const results = query.length
    ? BOOKS.filter(
        b =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.author.toLowerCase().includes(query.toLowerCase())
      )
    : BOOKS;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header + search input */}
      <View className="px-4 pt-2.5 pb-3">
        <Text className="font-display-sb text-xl text-text tracking-tight mb-3">Buscar</Text>

        <View
          className="flex-row items-center gap-2 bg-surface rounded-md px-3.5 py-2.5"
          style={{
            borderWidth: 1,
            borderColor: focused ? c.accent + '66' : 'transparent',
          }}
        >
          <Search size={15} color={c.t3} strokeWidth={1.6} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Título, autor o ISBN..."
            placeholderTextColor={c.t3}
            className="flex-1 text-text font-body text-base"
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={18} color={c.t3} strokeWidth={1.6} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <FlashList
        data={results}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72 }}
        ListHeaderComponent={
          <View className="mb-3">
            {/* Genre chips (when no query) */}
            {!query && (
              <View className="mb-4">
                <Text
                  className="text-xs text-t3 mb-2 tracking-widest"
                  style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
                >
                  Géneros
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {GENRES.map(g => (
                    <Pressable
                      key={g}
                      className="px-3 py-1 bg-surface rounded-full border border-border"
                    >
                      <Text className="text-sm text-t2 font-body">{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Text
              className="text-xs text-t3 mb-2.5 tracking-widest"
              style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
            >
              {query
                ? `${results.length} resultado${results.length !== 1 ? 's' : ''} · "${query}"`
                : 'Descubrir'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookCard book={item} onPress={() => setSelectedBook(item)} />
        )}
      />

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
