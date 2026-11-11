import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ChevronLeft,
  Lock,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheet } from '~/components/ui/BottomSheet'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { ErrorState } from '~/components/ui/ErrorState'
import { useStartDM } from '~/features/chat/hooks/useStartDM'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { IdentityCard } from '../components/IdentityCard'
import { ProfileStats } from '../components/ProfileStats'
import { ProfileSkeleton } from '../components/ProfileSkeleton'
import { ProfileLists } from '../components/ProfileLists'
import { ProfileSectionBoundary } from '../components/ProfileSection'
import { RecentReads } from '../components/RecentReads'
import { FollowButton } from '../components/FollowButton'
import { ReportSheet } from '../components/ReportSheet'
import { useProfile, useProfileContent } from '../hooks/useProfile'
import { useBlockUser } from '../hooks/useBlockUser'

// Mantiene visible la identidad y consulta el contenido únicamente cuando la relación concede acceso.
export default function PublicProfileScreen() {
  const { username = '' } = useLocalSearchParams<{ username: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()
  const userId = useAuthStore((s) => s.user?.id)
  const query = useProfile(username)
  const profile = query.data
  const own = !!profile && profile.id === userId
  const visible =
    !!profile &&
    (own ||
      !profile.is_private ||
      (profile.follow_status === 'accepted' &&
        !query.isFetching &&
        !query.isError))
  const content = useProfileContent(profile?.id ?? '', visible)
  const startDM = useStartDM()
  const { block } = useBlockUser(profile?.id ?? '', username)
  const [menu, setMenu] = useState(false)
  const [report, setReport] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  // Vuelve al origen o a la búsqueda cuando se abre el perfil mediante un enlace directo.
  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/search')
  }
  // Conserva el perfil y el error si no se puede iniciar la conversación.
  function message() {
    if (profile && !startDM.isPending)
      startDM.mutate(profile.id, {
        onSuccess: (id) =>
          router.push({ pathname: '/messages/[id]', params: { id } })
      })
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
      <View className="w-full max-w-[720px] self-center px-container py-2 flex-row items-center gap-2">
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-md hover:bg-surface focus-visible:outline focus-visible:outline-accent"
        >
          <ChevronLeft size={24} color={c.text} />
        </Pressable>
        <Text className="font-body text-xs text-t2 flex-1" numberOfLines={1}>
          @{username}
        </Text>
        {profile && !own && (
          <Pressable
            onPress={() => setMenu(true)}
            accessibilityRole="button"
            accessibilityLabel={t('social.profileOptions')}
            className="h-12 w-12 items-center justify-center rounded-md hover:bg-surface focus-visible:outline focus-visible:outline-accent"
          >
            <MoreHorizontal size={24} color={c.text} />
          </Pressable>
        )}
      </View>
      {query.isPending ? (
        <ProfileSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : !profile ? (
        <View className="flex-1 justify-center px-container gap-3">
          <Text className="font-display-sb text-lg text-text text-center">
            {t('social.unavailable')}
          </Text>
          <Text className="font-body text-sm text-t2 text-center">
            {t('social.unavailableHint')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
            paddingBottom: Math.max(insets.bottom, 24)
          }}
        >
          <IdentityCard user={profile} />
          <View className="px-container mb-6 gap-3">
            {own ? (
              <Pressable
                onPress={() => router.replace('/(tabs)/profile')}
                accessibilityRole="button"
                className="min-h-12 justify-center items-center rounded-md bg-sr px-4"
              >
                <Text className="font-body-sb text-xs text-text">
                  {t('social.openOwnProfile')}
                </Text>
              </Pressable>
            ) : (
              <>
                <FollowButton user={profile} />
                {visible && (
                  <Pressable
                    onPress={message}
                    disabled={startDM.isPending}
                    accessibilityRole="button"
                    className="min-h-12 items-center justify-center flex-row gap-2 rounded-md border border-border hover:bg-surface focus-visible:outline focus-visible:outline-accent"
                  >
                    <MessageCircle size={18} color={c.text} />
                    <Text className="font-body-sb text-xs text-text">
                      {t('social.message')}
                    </Text>
                  </Pressable>
                )}
                {startDM.isError && (
                  <Text
                    accessibilityRole="alert"
                    className="font-body text-xs text-text"
                  >
                    {t('social.messageError')}
                  </Text>
                )}
              </>
            )}
          </View>
          <ProfileStats
            books={profile.books_read_count ?? 0}
            reviews={profile.reviews_count ?? 0}
            followers={profile.followers_count ?? 0}
            following={profile.following_count ?? 0}
            onPressReviews={
              visible
                ? () =>
                    router.push({
                      pathname: '/user-reviews/[username]',
                      params: { username: profile.username }
                    })
                : undefined
            }
            onPressFollowers={
              visible
                ? () =>
                    router.push({
                      pathname: '/followers',
                      params: { username: profile.username, tab: 'followers' }
                    })
                : undefined
            }
            onPressFollowing={
              visible
                ? () =>
                    router.push({
                      pathname: '/followers',
                      params: { username: profile.username, tab: 'following' }
                    })
                : undefined
            }
          />
          {visible ? (
            <>
              <ProfileSectionBoundary
                query={content.recentReads}
                title={t('profile.recentReads')}
              >
                <RecentReads
                  books={content.recentReads.data ?? []}
                  emptyMessage={t('social.noRecentReads')}
                />
              </ProfileSectionBoundary>
              <ProfileSectionBoundary
                query={content.lists}
                title={t('social.publicLists')}
              >
                <ProfileLists
                  lists={(content.lists.data ?? []).filter(
                    (list) => list.visibility === 'public'
                  )}
                  title={t('social.publicLists')}
                  onPress={(list) =>
                    router.push({
                      pathname: '/list/[slug]',
                      params: { slug: list.slug }
                    })
                  }
                />
              </ProfileSectionBoundary>
            </>
          ) : (
            <View className="mx-container mb-8 p-6 items-center gap-4 bg-sr rounded-card">
              <Lock size={28} color={c.t2} />
              <Text className="font-display-sb text-lg text-text text-center">
                {t('social.privateAccount')}
              </Text>
              <Text className="font-body text-sm text-t2 text-center">
                {t(
                  query.isFetching
                    ? 'social.checkingAccess'
                    : profile.follow_status === 'pending'
                      ? 'social.pendingHint'
                      : 'social.privateHint'
                )}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      {menu && profile && (
        <BottomSheet
          title={t('social.profileOptions')}
          onClose={() => setMenu(false)}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenu(false)
              setReport(true)
            }}
            className="min-h-12 justify-center"
          >
            <Text className="font-body text-sm text-text">
              {t('user.reportUser')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenu(false)
              setConfirmBlock(true)
            }}
            className="min-h-12 justify-center"
          >
            <Text className="font-body text-sm text-text">
              {t('user.blockUser')}
            </Text>
          </Pressable>
        </BottomSheet>
      )}
      {report && profile && (
        <ReportSheet
          targetType="user"
          targetId={profile.id}
          targetName={'@' + profile.username}
          onClose={() => setReport(false)}
        />
      )}
      {confirmBlock && (
        <ConfirmDialog
          title={t('user.blockUser')}
          description={t('social.blockHint')}
          confirmLabel={t('user.blockUser')}
          pending={block.isPending}
          error={block.isError ? t('social.followError') : undefined}
          onClose={() => setConfirmBlock(false)}
          onConfirm={() =>
            block.mutate(undefined, {
              onSuccess: () => {
                setConfirmBlock(false)
                goBack()
              }
            })
          }
        />
      )}
    </View>
  )
}
