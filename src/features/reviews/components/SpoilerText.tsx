import { Eye, EyeOff } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'

// No monta texto sensible hasta revelarlo; una edición vuelve a ocultarlo incluso en listas recicladas.
export function SpoilerText({
  body,
  containsSpoilers,
  contentId,
  numberOfLines = 6
}: {
  body: string
  containsSpoilers: boolean
  contentId: string
  numberOfLines?: number
}) {
  const { t } = useTranslation()
  const c = useColors()
  const identity = `${contentId}:${containsSpoilers}:${body}`
  const [revealState, setRevealState] = useState({ identity, visible: false })
  if (revealState.identity !== identity)
    setRevealState({ identity, visible: false })
  const [expanded, setExpanded] = useState<string | null>(null)
  const hidden =
    containsSpoilers &&
    (revealState.identity !== identity || !revealState.visible)
  return (
    <View className="gap-2">
      {containsSpoilers && (
        <View className="gap-2 rounded-md border border-border bg-sr p-3">
          <View className="flex-row items-center gap-2">
            <EyeOff size={20} color={c.text} />
            <Text className="font-body-sb text-xs text-text">
              {t('book.spoilers')}
            </Text>
          </View>
          {hidden && (
            <Text className="font-body text-xs text-t2">
              {t('reviews.spoilerHint')}
            </Text>
          )}
          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              setRevealState({ identity, visible: hidden })
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: !hidden }}
            aria-expanded={!hidden}
            className="min-h-12 flex-row items-center gap-2 rounded-md px-2 active:bg-sh focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Eye size={20} color={c.text} />
            <Text className="font-body-sb text-xs text-text">
              {t(hidden ? 'reviews.showSpoiler' : 'reviews.hideSpoiler')}
            </Text>
          </Pressable>
        </View>
      )}
      {!hidden && (
        <>
          <Text
            className="font-body text-xs text-t2"
            numberOfLines={expanded === identity ? undefined : numberOfLines}
          >
            {body}
          </Text>
          {body.length > 220 && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                setExpanded(expanded === identity ? null : identity)
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: expanded === identity }}
              className="min-h-12 justify-center self-start rounded-md px-2 active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Text className="font-body-sb text-xs text-text">
                {t(expanded === identity ? 'common.seeLess' : 'common.seeMore')}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  )
}
