import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { ProfileLists } from '~/features/user/components/ProfileLists';
import { ProfileStats } from '~/features/user/components/ProfileStats';
import { ReadingGoal } from '~/features/user/components/ReadingGoal';
import { RecentReads } from '~/features/user/components/RecentReads';
import { useColors } from '~/theme/colors';
import { ME, MOCK_LISTS, MY_BOOKS, type MockBook } from '~/mock';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const booksRead = MY_BOOKS.filter((b) => b.status === 'read').length;
  const recentReads = MY_BOOKS.filter((b) => b.status === 'read').slice(0, 4);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">Perfil</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/settings')}>
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

        <ProfileStats
          books={ME.books}
          reviews={ME.reviews}
          followers={ME.followers}
          following={ME.following}
        />

        <ReadingGoal
          booksRead={booksRead}
          goal={ME.goal}
          goalYear={ME.goalYear}
        />

        <RecentReads books={recentReads} onPress={setSelectedBook} />

        <ProfileLists lists={MOCK_LISTS} />
      </ScrollView>

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
