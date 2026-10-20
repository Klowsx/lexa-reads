import { BookOpen, ChevronRight, Pin } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { BookCover } from '~/components/ui/BookCover'
import type { ListRow } from '~/features/lists/list.queries'
import { useColors } from '~/theme/colors'
import { ProfileEmptyState, ProfileSectionHeading } from './ProfileSection'

interface Props {
  lists: ListRow[]
  onNewList?: () => void
  onPress?: (list: ListRow) => void
  onToggleFeatured?: (id: string) => void
  isUpdating?: boolean
  title?: string
}

export function ProfileLists({
  lists,
  onNewList,
  onPress,
  onToggleFeatured,
  isUpdating = false,
  title
}: Props) {
  const c = useColors()
  const { t } = useTranslation()
  return (
    <View className="px-container pb-8">
      <ProfileSectionHeading
        title={title ?? t('profile.myLists')}
        action={lists.length ? t('profile.newList') : undefined}
        onAction={onNewList}
      />
      {!lists.length ? (
        <ProfileEmptyState
          message={onNewList ? t('profile.listsEmpty') : t('profile.noLists')}
          action={t('lists.createList')}
          onAction={onNewList}
        />
      ) : (
        <View>
          {lists.map((list, index) => {
            const isFeatured = list.is_featured ?? false
            const cover = list.preview_books?.find(Boolean)
            return (
              <View
                key={list.id}
                className={
                  index > 0
                    ? 'flex-row items-center border-t border-border'
                    : 'flex-row items-center'
                }
              >
                <Pressable
                  onPress={() => onPress?.(list)}
                  disabled={!onPress}
                  accessibilityRole={onPress ? 'button' : 'text'}
                  accessibilityLabel={
                    list.name +
                    ', ' +
                    t('lists.booksCount', { count: list.books_count ?? 0 }) +
                    ', ' +
                    t(
                      list.visibility === 'public'
                        ? 'lists.public'
                        : 'lists.private'
                    )
                  }
                  className="flex-1 min-w-0 flex-row items-center gap-3 py-4 rounded-sm active:bg-surface"
                >
                  {cover ? (
                    <BookCover book={cover} width={40} height={60} />
                  ) : (
                    <View className="w-10 h-[60px] rounded-sm bg-surface items-center justify-center">
                      <BookOpen size={20} color={c.t2} strokeWidth={1.5} />
                    </View>
                  )}
                  <View className="flex-1 min-w-0 gap-1">
                    <Text
                      className="font-body-sb text-xs text-text"
                      numberOfLines={2}
                    >
                      {list.name}
                    </Text>
                    <Text className="font-body text-xs text-t2">
                      {t('lists.booksCount', { count: list.books_count ?? 0 })}{' '}
                      ·{' '}
                      {t(
                        list.visibility === 'public'
                          ? 'lists.public'
                          : 'lists.private'
                      )}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={c.t2} strokeWidth={1.6} />
                </Pressable>
                {onToggleFeatured ? (
                  <Pressable
                    onPress={() => onToggleFeatured(list.id)}
                    disabled={isUpdating}
                    accessibilityRole="checkbox"
                    accessibilityLabel={
                      t(isFeatured ? 'lists.unfeature' : 'lists.feature') +
                      ': ' +
                      list.name
                    }
                    accessibilityState={{
                      checked: isFeatured,
                      disabled: isUpdating,
                      busy: isUpdating
                    }}
                    aria-checked={isFeatured}
                    aria-busy={isUpdating}
                    className="min-w-11 min-h-11 ml-2 rounded-md items-center justify-center active:opacity-70"
                    style={{
                      backgroundColor: isFeatured ? c.sr : 'transparent',
                      opacity: isUpdating ? 0.5 : undefined
                    }}
                  >
                    <Pin
                      size={18}
                      color={c.text}
                      fill={isFeatured ? c.text : 'transparent'}
                      strokeWidth={1.6}
                    />
                  </Pressable>
                ) : null}
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
