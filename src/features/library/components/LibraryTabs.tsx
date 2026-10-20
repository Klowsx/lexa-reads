import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text } from 'react-native'
import { type BookStatus } from '~/lib/book-status'
import { cn } from '~/lib/utils'

const TABS: { status: BookStatus; labelKey: string }[] = [
  { status: 'reading', labelKey: 'library.tabReading' },
  { status: 'read', labelKey: 'library.tabRead' },
  { status: 'want_to_read', labelKey: 'library.tabWantToRead' },
  { status: 'abandoned', labelKey: 'library.tabAbandoned' }
]

interface Props {
  activeTab: BookStatus
  countByStatus?: Record<BookStatus, number>
  onTabChange: (status: BookStatus) => void
}

// Permite recorrer los cuatro estados sin recortar etiquetas al ampliar la fuente o reducir el ancho.
export function LibraryTabs({ activeTab, countByStatus, onTabChange }: Props) {
  const { t } = useTranslation()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-b border-border"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {TABS.map(({ status, labelKey }) => {
        const active = activeTab === status

        return (
          <Pressable
            key={status}
            onPress={() => onTabChange(status)}
            accessibilityRole="tab"
            accessibilityLabel={t(labelKey)}
            accessibilityState={{ selected: active }}
            className={cn(
              'min-h-12 flex-1 items-center justify-center border-b-2 px-3 py-3 hover:bg-surface focus-visible:outline focus-visible:outline-accent',
              active ? 'border-accent' : 'border-transparent'
            )}
          >
            <Text
              className={
                active
                  ? 'font-body-sb text-sm text-text'
                  : 'font-body text-sm text-t2'
              }
            >
              {countByStatus?.[status] ?? '…'}
            </Text>
            <Text
              className={
                active
                  ? 'font-body-sb text-xs text-text'
                  : 'font-body text-xs text-t2'
              }
            >
              {t(labelKey)}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
