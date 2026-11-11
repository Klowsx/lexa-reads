import { StarRating } from '~/components/ui/StarRating'
import { Image } from 'expo-image'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { fixed, rawLight } from '~/theme/colors'
import { fontFamily } from '~/theme/typography'
import type { Tables } from '~/types/database'

// Dimensiones fijas para la tarjeta de compartir — aspect ratio ~3:4
const W = 320
const H = 480
const COVER_W = 120
const COVER_H = 180
const BG = rawLight.bg

interface BookShareCardProps {
  book: Tables<'books'>
  rating?: number | null
  username?: string | null
  onCoverReady?: (imageFailed: boolean) => void
}

// Notifica cuándo la portada o su alternativa ya se dibujaron para permitir una captura completa.
export function BookShareCard({
  book,
  rating,
  username,
  onCoverReady
}: BookShareCardProps) {
  const [coverFailed, setCoverFailed] = useState(false)
  const { t } = useTranslation()
  const author = book.authors?.[0] ?? ''

  return (
    <View style={s.card}>
      {/* Cover */}
      <View style={s.shadow}>
        {book.cover_url && !coverFailed ? (
          <Image
            source={{ uri: book.cover_url }}
            style={s.cover}
            contentFit="cover"
            onDisplay={() => onCoverReady?.(false)}
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <View
            style={[s.cover, s.coverFallback]}
            onLayout={() => onCoverReady?.(Boolean(book.cover_url))}
          >
            <Text style={s.coverText} numberOfLines={6}>
              {book.title}
            </Text>
          </View>
        )}
      </View>

      {/* Meta */}
      <Text style={s.title} numberOfLines={2}>
        {book.title}
      </Text>
      {author ? (
        <Text style={s.author} numberOfLines={1}>
          {author}
        </Text>
      ) : null}

      {rating != null && (
        <View style={s.ratingRow}>
          <StarRating rating={rating} size={18} />
          <Text style={s.ratingValue}>{rating.toFixed(1)}</Text>
        </View>
      )}

      {username ? (
        <Text style={s.username}>
          {t('sharePreview.sharedBy', { username })}
        </Text>
      ) : null}

      {/* Branding */}
      <View style={s.footer}>
        <Text style={s.brand}>lexa</Text>
        <Text style={s.url}>lexareads.app/book/{book.id}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: W,
    height: H,
    backgroundColor: BG,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 44,
    overflow: 'hidden'
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 5
  },
  coverFallback: {
    backgroundColor: rawLight.sr,
    justifyContent: 'flex-end',
    padding: 8
  },
  coverText: {
    color: rawLight.t2,
    fontSize: 9,
    fontFamily: fontFamily.serif,
    lineHeight: 13
  },
  title: {
    color: rawLight.text,
    fontSize: 22,
    fontFamily: fontFamily.serifSemiBold,
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 5
  },
  author: {
    color: rawLight.t2,
    fontSize: 14,
    fontFamily: fontFamily.sans,
    textAlign: 'center',
    marginBottom: 10
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  ratingValue: {
    color: rawLight.t2,
    fontSize: 11,
    fontFamily: fontFamily.sans,
    marginLeft: 5
  },
  username: {
    color: rawLight.t2,
    fontSize: 11,
    fontFamily: fontFamily.sans,
    marginTop: 2
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  brand: {
    color: fixed.accent,
    fontSize: 14,
    fontFamily: fontFamily.serifItalic,
    letterSpacing: 0.4
  },
  url: {
    color: rawLight.t2,
    fontSize: 9,
    fontFamily: fontFamily.sans
  }
})
