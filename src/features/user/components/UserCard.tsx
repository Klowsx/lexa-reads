import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Avatar } from '~/components/ui/Avatar'
import { SearchAction } from '~/features/search/components/SearchControls'
import { useFollow } from '~/features/user/hooks/useFollow'
import { useProfile } from '~/features/user/hooks/useProfile'
import type { SearchUser } from '~/features/user/user.queries'
import { useAuthStore } from '~/stores/auth.store'

interface Props {
  user: SearchUser
}

// Muestra al lector y refleja el seguimiento persistido, incluidas solicitudes privadas.
export function UserCard({ user }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isOwnProfile = currentUserId === user.id
  const profile = useProfile(isOwnProfile ? '' : user.username)
  const { follow, unfollow } = useFollow(
    user.id,
    user.username,
    user.is_private ?? false
  )
  const followStatus = profile.data?.follow_status
  const busy = follow.isPending || unfollow.isPending
  const label = busy
    ? t('search.saving')
    : followStatus === 'pending'
      ? t('search.requested')
      : followStatus === 'accepted'
        ? t('common.following')
        : t('common.follow')

  // Cambia el seguimiento solamente después de conocer el estado actual del perfil.
  function handleFollow() {
    if (busy || !profile.data) return
    follow.reset()
    unfollow.reset()
    if (followStatus) unfollow.mutate()
    else follow.mutate()
  }

  return (
    <View className="mb-4 gap-2">
      <View className="flex-row flex-wrap items-center gap-3">
        <Pressable
          onPress={() => router.push('/user/' + user.username)}
          accessibilityRole="button"
          accessibilityLabel={t('search.openReader', {
            name: user.display_name || user.username
          })}
          className="min-w-0 flex-1 flex-row items-center gap-3 rounded-md py-2 hover:bg-surface active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Avatar
            neutral
            displayName={user.display_name || user.username}
            username={user.username}
            avatarUrl={user.avatar_url}
            size={48}
          />
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-body-sb text-xs text-text" numberOfLines={1}>
              {user.display_name || user.username}
            </Text>
            <Text className="font-body text-xs text-t2" numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
        </Pressable>
        {!isOwnProfile && (
          <SearchAction
            label={
              profile.isError
                ? t('common.retry')
                : profile.isPending
                  ? t('common.loading')
                  : label
            }
            onPress={
              profile.isError
                ? () => {
                    void profile.refetch()
                  }
                : handleFollow
            }
            selected={!!followStatus}
            disabled={busy || (profile.isPending && !profile.isError)}
          />
        )}
      </View>
      {user.bio ? (
        <Text className="font-body text-xs text-t2" numberOfLines={2}>
          {user.bio}
        </Text>
      ) : null}
      {(follow.isError || unfollow.isError) && (
        <Text accessibilityRole="alert" className="font-body text-xs text-text">
          {t('search.followError')}
        </Text>
      )}
    </View>
  )
}
