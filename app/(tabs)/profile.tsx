import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { CurrentlyReading } from '~/features/user/components/CurrentlyReading';
import { EditProfileSheet } from '~/features/user/components/EditProfileSheet';
import { IdentityCard } from '~/features/user/components/IdentityCard';
import { ProfileLists } from '~/features/user/components/ProfileLists';
import { ProfileStats } from '~/features/user/components/ProfileStats';
import { ReadingGoal } from '~/features/user/components/ReadingGoal';
import { RecentReads } from '~/features/user/components/RecentReads';
import { useReadingGoal } from '~/features/user/hooks/useReadingGoal';
import { useColors } from '~/theme/colors';
import { ME, MOCK_LISTS, MY_BOOKS, type MockBook } from '~/mock';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const { data: goalData } = useReadingGoal();

  const readingBooks = MY_BOOKS.filter((b) => b.status === 'reading');
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
        <IdentityCard user={ME} onEditPress={() => setShowEdit(true)} />

        <ProfileStats
          books={ME.books}
          reviews={ME.reviews}
          followers={ME.followers}
          following={ME.following}
        />

        <CurrentlyReading books={readingBooks} onPress={setSelectedBook} />

        {goalData && (
          <ReadingGoal
            booksRead={goalData.booksRead}
            goal={goalData.goal}
            goalYear={goalData.goalYear}
            onEditGoal={() => router.push('/settings')}
          />
        )}

        <RecentReads books={recentReads} onPress={setSelectedBook} />

        <ProfileLists lists={MOCK_LISTS} />
      </ScrollView>

      {showEdit && (
        <EditProfileSheet user={ME} onClose={() => setShowEdit(false)} />
      )}

      {selectedBook && (
        <BookDetailSheet book={selectedBook as any} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
