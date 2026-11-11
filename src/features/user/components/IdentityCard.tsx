import { Lock, Pencil } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { Avatar } from '~/components/ui/Avatar'
import { useColors } from '~/theme/colors'
import type { UserProfile } from '~/types/user'
import { normalizeProfileGenres } from '../profile-genres'

interface Props {
  user: UserProfile
  onEditPress?: () => void
}

// Comparte la identidad editorial del lector en su perfil propio y en la visita a otros perfiles.
export function IdentityCard({ user, onEditPress }: Props) {
  const { t } = useTranslation()
  const c = useColors()
  const centered = !onEditPress

  return (
    <View
      className={`px-container pt-6 pb-6 gap-5 ${centered ? 'items-center' : ''}`}
    >
      <View
        className={`${centered ? 'items-center w-full' : 'flex-row items-start'} gap-4`}
      >
        <View className="rounded-full bg-bg p-1">
          <Avatar
            displayName={user.display_name}
            username={user.username}
            avatarUrl={user.avatar_url}
            size={centered ? 96 : 80}
            neutral
          />
        </View>
        <View
          className={`${centered ? 'items-center' : 'flex-1'} min-w-0 gap-1 pt-1`}
        >
          <Text
            selectable
            className={`font-display-sb text-xl text-text tracking-tight ${centered ? 'text-center' : ''}`}
          >
            {user.display_name || user.username}
          </Text>
          <Text selectable className="font-body text-xs text-t2">
            @{user.username}
          </Text>
        </View>
        {onEditPress && (
          <Pressable
            onPress={onEditPress}
            accessibilityRole="button"
            accessibilityLabel={t('editProfile.title')}
            className="min-h-12 min-w-12 rounded-full bg-surface items-center justify-center active:bg-sr"
          >
            <Pencil size={18} color={c.text} strokeWidth={1.6} />
          </Pressable>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        {user.is_private && <Lock size={16} color={c.t2} accessible={false} />}
        <Text className="font-body text-xs text-t2">
          {t(
            user.is_private ? 'social.privateAccount' : 'social.publicAccount'
          )}
        </Text>
      </View>
      {user.bio ? (
        <Text
          selectable
          className={`font-body text-sm text-text leading-7 ${centered ? 'text-center' : ''}`}
        >
          {user.bio}
        </Text>
      ) : null}
      {user.favorite_genres?.length ? (
        <View
          className={`flex-row flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}
          accessibilityLabel={t('editProfile.favoriteGenres')}
        >
          {normalizeProfileGenres(user.favorite_genres).map((genre) => (
            <View key={genre} className="rounded-full bg-surface px-3 py-1.5">
              <Text className="font-body text-xs text-t2">
                {t(`profileGenres.${genre}`, { defaultValue: genre })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
