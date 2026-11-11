import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

const TAB_KEYS = [
  'book.tabs.summary',
  'book.tabs.reviews',
  'book.tabs.community',
  'book.tabs.similar'
] as const
export type BookTab = 0 | 1 | 2 | 3

interface BookTabBarProps {
  activeTab: BookTab
  onChange: (tab: BookTab) => void
}

// Conserva etiquetas legibles y permite desplazar las pestañas cuando no caben.
export function BookTabBar({ activeTab, onChange }: BookTabBarProps) {
  const { t } = useTranslation()
  const c = useColors()

  return (
    <View className="bg-bg border-b border-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View
          accessibilityRole="tablist"
          className="flex-row px-container"
          style={{ minWidth: '100%' }}
        >
          {TAB_KEYS.map((key, i) => {
            const active = activeTab === i
            const label = t(key)
            return (
              <Pressable
                key={key}
                onPress={() => onChange(i as BookTab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                aria-selected={active}
                className="min-h-14 grow shrink-0 items-center justify-center px-3 py-3 active:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                style={{
                  borderBottomWidth: 2.5,
                  borderBottomColor: active ? c.accent : 'transparent'
                }}
              >
                <Text
                  className={
                    active
                      ? 'font-body-sb text-sm text-text'
                      : 'font-body text-sm text-t2'
                  }
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
