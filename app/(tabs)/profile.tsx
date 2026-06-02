import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { useLibrary } from '~/features/library/hooks/useLibrary';
import { useUserLists } from '~/features/lists/hooks/useUserLists';
import { useUpdateList } from '~/features/lists/hooks/useUpdateList';
import type { ListRow } from '~/features/lists/list.queries';
import { CurrentlyReading } from '~/features/user/components/CurrentlyReading';
import { EditProfileSheet } from '~/features/user/components/EditProfileSheet';
import { FeaturedLists } from '~/features/user/components/FeaturedLists';
import { IdentityCard } from '~/features/user/components/IdentityCard';
import { ProfileLists } from '~/features/user/components/ProfileLists';
import { ProfileStats } from '~/features/user/components/ProfileStats';
import { ReadingGoal } from '~/features/user/components/ReadingGoal';
import { RecentReads } from '~/features/user/components/RecentReads';
import { useMe } from '~/features/user/hooks/useMe';
import { useReadingGoal } from '~/features/user/hooks/useReadingGoal';
import type { LibraryRow } from '~/features/library/library.queries';
import type { Tables } from '~/types';
import { useColors } from '~/theme/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();

  const { data: me, isLoading } = useMe();
  const { data: goalData } = useReadingGoal();
  const { data: readingBooks = [] } = useLibrary('reading');
  const { data: readBooks = [] } = useLibrary('read');
  const { data: lists = [] } = useUserLists();

  const updateListMutation = useUpdateList('');

  const [selectedBook, setSelectedBook] = useState<Tables<'books'> | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const recentReads = (readBooks as LibraryRow[]).slice(0, 8);

  function handleToggleFeatured(listId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    updateListMutation.mutate({
      listId,
      isFeatured: !list.is_featured,
    });
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (!me) return null;

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
        <IdentityCard user={me} onEditPress={() => setShowEdit(true)} />

        <ProfileStats
          books={me.books_read_count ?? 0}
          reviews={me.reviews_count ?? 0}
          followers={me.followers_count ?? 0}
          following={me.following_count ?? 0}
          onPressBooks={() => router.navigate('/(tabs)/library' as any)}
          onPressReviews={() => router.push('/my-reviews' as any)}
          onPressFollowers={() =>
            router.push(`/followers?username=${me.username}&tab=followers` as any)
          }
          onPressFollowing={() =>
            router.push(`/followers?username=${me.username}&tab=following` as any)
          }
        />

        <FeaturedLists
          lists={lists}
          onPress={(list) =>
            router.push({ pathname: '/list/[slug]', params: { slug: list.slug } } as any)
          }
        />

        <CurrentlyReading books={readingBooks as LibraryRow[]} />

        {goalData && (
          <ReadingGoal
            booksRead={goalData.booksRead}
            goal={goalData.goal}
            goalYear={goalData.goalYear}
            onEditGoal={() => router.push('/settings')}
          />
        )}

        <RecentReads
          books={recentReads}
          onViewAll={() => router.navigate('/(tabs)/library' as any)}
        />

        <ProfileLists
          lists={lists}
          onNewList={() => router.push('/list/new' as any)}
          onToggleFeatured={handleToggleFeatured}
          onPress={(list: ListRow) =>
            router.push({ pathname: '/list/[slug]', params: { slug: list.slug } } as any)
          }
        />
      </ScrollView>

      {showEdit && (
        <EditProfileSheet user={me} onClose={() => setShowEdit(false)} />
      )}

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
