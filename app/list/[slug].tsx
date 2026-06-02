import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Globe, Lock, MoreHorizontal, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { StarRating } from '~/components/ui/StarRating';
import { LIST_BOOKS, MOCK_LISTS, type MockBook } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

export default function ListDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const list = MOCK_LISTS.find((l) => l.id === slug) ?? MOCK_LISTS[0];
  const books = LIST_BOOKS[list.id] ?? [];
  const isPrivate = list.visibility === 'Privada';

  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  function openMenu() {
    Alert.alert(list.name, undefined, [
      { text: 'Editar lista',    onPress: () => {} },
      { text: isPrivate ? 'Hacer pública' : 'Hacer privada', onPress: () => {} },
      { text: 'Eliminar lista', style: 'destructive', onPress: () => {} },
      { text: 'Cancelar',       style: 'cancel' },
    ]);
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1" numberOfLines={1}>
          {list.name}
        </Text>
        <Pressable hitSlop={8} onPress={openMenu}>
          <MoreHorizontal size={20} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* List hero */}
        <LinearGradient
          colors={[alpha(list.col, 0.18), alpha(list.col, 0.04)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 mb-5 rounded-lg p-4 border"
          style={{ borderColor: alpha(list.col, 0.25) }}
        >
          {/* Color stripe */}
          <View
            className="absolute left-0 top-0 bottom-0 rounded-l-lg w-1"
            style={{ backgroundColor: list.col }}
          />

          <View className="flex-row items-center gap-2 mb-2">
            {isPrivate ? (
              <Lock size={13} color={c.t3} strokeWidth={1.8} />
            ) : (
              <Globe size={13} color={c.t3} strokeWidth={1.8} />
            )}
            <Text className="text-xs font-body text-t3">{list.visibility}</Text>
            <Text className="text-xs font-body text-t3">·</Text>
            <Text className="text-xs font-body text-t3">{books.length} libros</Text>
          </View>

          <Text className="font-display-sb text-lg text-text leading-tight">
            {list.name}
          </Text>

          {list.desc && (
            <Text className="text-xs font-body text-t2 mt-1.5 leading-[19px]">
              {list.desc}
            </Text>
          )}
        </LinearGradient>

        {/* Books grid */}
        {books.length === 0 ? (
          <View className="items-center py-16 px-8 gap-3">
            <Text className="text-xs font-body text-t3 text-center">
              Esta lista está vacía. Añade libros desde la búsqueda.
            </Text>
            <Pressable
              onPress={() => router.navigate('/(tabs)/search' as any)}
              className="px-4 py-2.5 rounded-md"
              style={{ backgroundColor: c.accent }}
            >
              <Text className="text-xs font-body-sb" style={{ color: '#fff' }}>
                Buscar libros
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-4">
            <View className="flex-row flex-wrap gap-3">
              {books.map((book, i) => (
                <Pressable key={`${book.id}-${i}`} onPress={() => setSelectedBook(book)}>
                  <MockBookCover book={book} width={96} height={145} />
                  <Text
                    className="text-xs font-body-md text-text mt-1.5"
                    style={{ width: 96, lineHeight: 15 }}
                    numberOfLines={2}
                  >
                    {book.title}
                  </Text>
                  <Text
                    className="text-xs font-body text-t3 mt-0.5"
                    style={{ width: 96 }}
                    numberOfLines={1}
                  >
                    {book.author}
                  </Text>
                  <View className="mt-1">
                    <StarRating rating={book.avg} size={9} />
                  </View>
                </Pressable>
              ))}

              {/* Add book slot */}
              <Pressable
                onPress={() => router.navigate('/(tabs)/search' as any)}
                className="items-center justify-center rounded-sm border border-dashed"
                style={{
                  width: 96,
                  height: 145,
                  borderColor: alpha(c.border, 0.7),
                }}
              >
                <Plus size={22} color={c.t3} strokeWidth={1.5} />
                <Text className="text-xs font-body text-t3 mt-1.5 text-center" style={{ lineHeight: 15 }}>
                  Añadir{'\n'}libro
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedBook && (
        <BookDetailSheet book={selectedBook as any} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
