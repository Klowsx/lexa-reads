import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Avatar } from '~/components/ui/Avatar'
import { FollowButton } from './FollowButton'
import type { SearchUser } from '../user.queries'

interface Props {
  user: SearchUser
}

// Muestra al lector y refleja el seguimiento persistido, incluidas solicitudes privadas.
export function UserCard({ user }: Props) {
  const router = useRouter()
  const { t } = useTranslation()
  return (
    <View className="mb-3 p-4 rounded-card bg-surface gap-2">
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
            <Text className="font-body-sb text-sm text-text" numberOfLines={1}>
              {user.display_name || user.username}
            </Text>
            <Text className="font-body text-xs text-t2" numberOfLines={1}>
              @{user.username}
            </Text>
          </View>
        </Pressable>
        <FollowButton user={user} />
      </View>
      {user.bio ? (
        <Text className="font-body text-xs text-t2" numberOfLines={2}>
          {user.bio}
        </Text>
      ) : null}
    </View>
  )
}
