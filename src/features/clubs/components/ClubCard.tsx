import { Lock, Users, ChevronRight } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BookCover } from '~/components/ui/BookCover'
import { useColors } from '~/theme/colors'
import type { ClubListItem } from '../clubs.queries'

// Compone la ficha del club con los datos disponibles, sin inventar ritmo, roles o última actividad.
export function ClubCard({
  club,
  onPress
}: {
  club: ClubListItem
  onPress: () => void
}) {
  const c = useColors()
  const { t } = useTranslation()
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-4 gap-4 rounded-xl bg-surface p-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={t('stitch.social.openClub', { name: club.name })}
    >
      <View className="flex-row items-start gap-3">
        <Text
          className="flex-1 font-display-sb text-lg text-text"
          numberOfLines={3}
        >
          {club.name}
        </Text>
        <View className="flex-row items-center gap-1 rounded-full bg-sr px-2.5 py-1.5">
          {club.visibility === 'private' && <Lock size={13} color={c.t2} />}
          <Text className="font-body-sb text-xs text-t2">
            {t(`stitch.social.${club.visibility}`)}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Users size={18} color={c.t2} />
        <Text className="font-body text-sm text-t2">
          {t('stitch.social.members', { count: club.members_count })}
        </Text>
      </View>
      {club.description ? (
        <Text
          className="font-body text-sm leading-[22px] text-t2"
          numberOfLines={3}
        >
          {club.description}
        </Text>
      ) : null}
      {club.current_book && (
        <View className="flex-row items-center gap-3 rounded-lg bg-bg p-3">
          <BookCover book={club.current_book} width={44} height={66} />
          <View className="flex-1 gap-1">
            <Text className="font-body text-xs text-t2">
              {t('stitch.social.currentReading')}
            </Text>
            <Text
              className="font-display-sb text-md text-text"
              numberOfLines={2}
            >
              {club.current_book.title}
            </Text>
          </View>
        </View>
      )}
      <View className="min-h-12 flex-row items-center justify-between rounded-lg bg-sr px-4">
        <Text className="font-body-sb text-sm text-text">
          {t('stitch.social.openClubAction')}
        </Text>
        <ChevronRight size={18} color={c.text} />
      </View>
    </Pressable>
  )
}
