import { useRouter } from 'expo-router'
import { Settings } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { QueryBoundary } from '~/components/ui/QueryBoundary'
import { useLibrary } from '~/features/library/hooks/useLibrary'
import { useUserLists } from '~/features/lists/hooks/useUserLists'
import { useUpdateList } from '~/features/lists/hooks/useUpdateList'
import { CurrentlyReading } from '~/features/user/components/CurrentlyReading'
import { EditProfileSheet } from '~/features/user/components/EditProfileSheet'
import { FeaturedLists } from '~/features/user/components/FeaturedLists'
import { IdentityCard } from '~/features/user/components/IdentityCard'
import { ProfileLists } from '~/features/user/components/ProfileLists'
import { ProfileSectionBoundary } from '~/features/user/components/ProfileSection'
import { ProfileSkeleton } from '~/features/user/components/ProfileSkeleton'
import { ProfileStats } from '~/features/user/components/ProfileStats'
import { ReadingGoal } from '~/features/user/components/ReadingGoal'
import { RecentReads } from '~/features/user/components/RecentReads'
import { useMe } from '~/features/user/hooks/useMe'
import { useReadingGoal } from '~/features/user/hooks/useReadingGoal'
import { useColors } from '~/theme/colors'
import { FollowRequestsSection } from '../components/FollowRequestsSection'
import { usePendingFollowRequests } from '../hooks/usePendingFollowRequests'

// Reúne la identidad, solicitudes y lecturas propias con estados de carga independientes.
export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()
  const meQuery = useMe()
  const requestsQuery = usePendingFollowRequests()
  const goalQuery = useReadingGoal()
  const readingQuery = useLibrary('reading')
  const readQuery = useLibrary('read')
  const listsQuery = useUserLists()
  const lists = listsQuery.data ?? []
  const updateListMutation = useUpdateList('')
  const [showEdit, setShowEdit] = useState(false)

  // Destaca o retira una lista sin permitir otra escritura mientras se guarda.
  function handleToggleFeatured(listId: string) {
    const list = lists.find((item) => item.id === listId)
    if (!list || updateListMutation.isPending) return
    updateListMutation.mutate({ listId, isFeatured: !list.is_featured })
  }

  return (
    <View
      className="flex-1 bg-bg"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
    >
      <View className="w-full max-w-[720px] self-center px-container py-2 flex-row items-center justify-between">
        <Text
          accessibilityRole="header"
          className="font-display-sb text-xl text-text tracking-tight"
        >
          {t('profile.title')}
        </Text>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={t('profile.settings')}
          className="min-w-11 min-h-11 rounded-md items-center justify-center active:bg-sr"
        >
          <Settings size={22} color={c.text} strokeWidth={1.6} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 96 + insets.bottom,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center'
        }}
      >
        <QueryBoundary query={meQuery} skeleton={<ProfileSkeleton />}>
          {(me) =>
            me ? (
              <>
                <View className="mt-2">
                  <IdentityCard
                    user={me}
                    onEditPress={() => setShowEdit(true)}
                  />
                  <ProfileStats
                    books={me.books_read_count ?? 0}
                    reviews={me.reviews_count ?? 0}
                    followers={me.followers_count ?? 0}
                    following={me.following_count ?? 0}
                    onPressBooks={() => router.navigate('/(tabs)/library')}
                    onPressReviews={() => router.push('/my-reviews')}
                    onPressFollowers={() =>
                      router.push({
                        pathname: '/followers',
                        params: { username: me.username, tab: 'followers' }
                      })
                    }
                    onPressFollowing={() =>
                      router.push({
                        pathname: '/followers',
                        params: { username: me.username, tab: 'following' }
                      })
                    }
                  />
                </View>
                <ProfileSectionBoundary
                  query={requestsQuery}
                  title={t('profile.followRequests')}
                >
                  <FollowRequestsSection requests={requestsQuery.data ?? []} />
                </ProfileSectionBoundary>
                <ProfileSectionBoundary
                  query={readingQuery}
                  title={t('profile.currentlyReading')}
                >
                  <CurrentlyReading
                    books={readingQuery.data ?? []}
                    onDiscover={() => router.navigate('/(tabs)/search')}
                  />
                </ProfileSectionBoundary>
                <ProfileSectionBoundary
                  query={goalQuery}
                  title={t('profile.readingGoal')}
                >
                  {goalQuery.data ? (
                    <ReadingGoal
                      {...goalQuery.data}
                      onEditGoal={() => router.push('/settings')}
                    />
                  ) : null}
                </ProfileSectionBoundary>
                <ProfileSectionBoundary
                  query={readQuery}
                  title={t('profile.recentReads')}
                >
                  <RecentReads
                    books={(readQuery.data ?? []).slice(0, 8)}
                    onViewAll={() => router.navigate('/(tabs)/library')}
                  />
                </ProfileSectionBoundary>
                <ProfileSectionBoundary
                  query={listsQuery}
                  title={t('profile.myLists')}
                >
                  <FeaturedLists
                    lists={lists}
                    onPress={(list) =>
                      router.push({
                        pathname: '/list/[slug]',
                        params: { slug: list.slug }
                      })
                    }
                  />
                  {updateListMutation.isError ? (
                    <Text
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite"
                      className="px-container mb-3 font-body text-xs text-text"
                    >
                      {t('profile.featureError')}
                    </Text>
                  ) : null}
                  <ProfileLists
                    lists={lists}
                    onNewList={() => router.push('/list/new')}
                    onToggleFeatured={handleToggleFeatured}
                    isUpdating={updateListMutation.isPending}
                    onPress={(list) =>
                      router.push({
                        pathname: '/list/[slug]',
                        params: { slug: list.slug }
                      })
                    }
                  />
                </ProfileSectionBoundary>
              </>
            ) : null
          }
        </QueryBoundary>
      </ScrollView>
      {showEdit && meQuery.data ? (
        <EditProfileSheet
          user={meQuery.data}
          onClose={() => setShowEdit(false)}
        />
      ) : null}
    </View>
  )
}
