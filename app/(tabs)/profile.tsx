import { ChevronRight, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { ME, MOCK_LISTS, MY_BOOKS, type MockBook } from '~/mock';
import { useColors } from '~/lib/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const booksRead = MY_BOOKS.filter(b => b.status === 'read').length;
  const pct = Math.min(booksRead / ME.goal, 1);
  const recentReads = MY_BOOKS.filter(b => b.status === 'read').slice(0, 4);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">Perfil</Text>
        <Pressable hitSlop={8}>
          <Settings size={20} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 72 }}
      >
        {/* Avatar + info */}
        <View className="flex-row gap-4 items-center px-4 pb-5">
          <Avatar user={ME} size={72} />
          <View className="flex-1">
            <Text className="text-md font-body-sb text-text">{ME.name}</Text>
            <Text className="text-sm font-body text-t2 mt-0.5">@{ME.username}</Text>
            <Text className="text-xs font-body text-t3 mt-1.5">{ME.bio}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View
          className="mx-4 mb-4 rounded-md flex-row border border-border"
          style={{ backgroundColor: '#1C1815' /* surface */ }}
        >
          {([
            ['Libros',     ME.books],
            ['Reseñas',    ME.reviews],
            ['Seguidores', ME.followers],
            ['Siguiendo',  ME.following],
          ] as const).map(([label, value], i) => (
            <View
              key={label}
              className="flex-1 items-center py-3.5"
              style={{ borderRightWidth: i < 3 ? 1 : 0, borderRightColor: '#35302B' }}
            >
              <Text className="text-lg font-body-sb text-text">{value}</Text>
              <Text className="text-xs font-body text-t3 mt-0.5">{label}</Text>
            </View>
          ))}
        </View>

        {/* Reading goal */}
        <View
          className="mx-4 mb-5 rounded-md p-4 border border-border bg-surface"
        >
          <View className="flex-row items-baseline justify-between mb-2">
            <Text className="text-sm font-body-md text-t2">Meta {ME.goalYear}</Text>
            <Text className="font-body-sb text-lg" style={{ color: c.accent }}>
              {booksRead}
              <Text className="text-sm text-t3 font-body">/{ME.goal}</Text>
            </Text>
          </View>

          {/* Progress bar */}
          <View className="h-1.5 rounded-full bg-sh overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${pct * 100}%`, backgroundColor: c.accent }}
            />
          </View>

          <Text className="text-xs font-body text-t3 mt-1.5">
            {Math.round(pct * 100)}% completado · {ME.goal - booksRead} libros por leer
          </Text>
        </View>

        {/* Recent reads */}
        <View className="mb-5">
          <Text
            className="text-xs text-t3 tracking-widest mb-2.5 px-4"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Leídos recientemente
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {recentReads.map(({ book, rating }) => (
              <Pressable key={book.id} onPress={() => setSelectedBook(book)}>
                <BookCover book={book} width={62} height={93} />
                {rating != null && (
                  <View className="mt-1">
                    <StarRating rating={rating} size={8} />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Lists */}
        <View className="px-4">
          <Text
            className="text-xs text-t3 tracking-widest mb-2.5"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Mis listas
          </Text>
          {MOCK_LISTS.map(list => (
            <Pressable
              key={list.name}
              className="flex-row items-center justify-between px-3.5 py-3 bg-surface rounded-md border border-border mb-2"
            >
              <View>
                <Text className="text-sm font-body-sb text-text">{list.name}</Text>
                <Text className="text-xs font-body text-t3 mt-0.5">
                  {list.count} libros · {list.visibility}
                </Text>
              </View>
              <ChevronRight size={16} color={c.t3} strokeWidth={1.6} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
