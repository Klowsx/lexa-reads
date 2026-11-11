import { StarRating } from '~/components/ui/StarRating'
import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { fixed, rawLight } from '~/theme/colors'
import { fontFamily } from '~/theme/typography'
import type { ReviewWithUser } from '~/features/book/book.queries'
import { useTranslation } from 'react-i18next'

const W = 320
const BG = rawLight.bg
const MAX_REVIEW_CHARS = 280

interface ReviewShareCardProps {
  review: ReviewWithUser
  bookTitle?: string | null
  bookCoverUrl?: string | null
  bookId?: string | null
  onCoverReady?: (imageFailed: boolean) => void
}

// Las tarjetas exportadas nunca incluyen texto marcado como spoiler, aunque ya se haya revelado en pantalla.
export function ReviewShareCard({
  review,
  bookTitle,
  bookCoverUrl,
  bookId,
  onCoverReady
}: ReviewShareCardProps) {
  const { t } = useTranslation()
  const user = review.users ?? {
    username: t('stitch.catalog.reader'),
    display_name: null,
    avatar_url: null
  }
  const displayName = user.display_name ?? user.username
  const rating = (review as any).rating as number | null | undefined
  const [coverFailed, setCoverFailed] = useState(false)
  const body = review.contains_spoilers
    ? t('reviews.sharedSpoiler')
    : review.body.length > MAX_REVIEW_CHARS
      ? review.body.slice(0, MAX_REVIEW_CHARS - 1) + '…'
      : review.body

  // Initials for avatar fallback
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <View
      style={s.card}
      onLayout={() => {
        if (!bookCoverUrl) onCoverReady?.(false)
      }}
    >
      {/* Reviewer header */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.headerMeta}>
          <Text style={s.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={s.username}>@{user.username}</Text>
        </View>
        {bookCoverUrl && !coverFailed ? (
          <Image
            source={{ uri: bookCoverUrl }}
            style={s.miniCover}
            contentFit="cover"
            onDisplay={() => onCoverReady?.(false)}
            onError={() => setCoverFailed(true)}
          />
        ) : bookCoverUrl ? (
          <View
            style={[
              s.miniCover,
              {
                backgroundColor: fixed.cover.backgrounds[0],
                alignItems: 'center',
                justifyContent: 'center'
              }
            ]}
            onLayout={() => onCoverReady?.(true)}
          >
            <Text numberOfLines={3} style={s.bookTitle}>
              {bookTitle ?? 'Lexa'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Book + rating */}
      {bookTitle ? (
        <Text style={s.bookTitle} numberOfLines={1}>
          &quot;{bookTitle}&quot;
        </Text>
      ) : null}

      {rating != null ? (
        <View style={s.ratingRow}>
          <StarRating rating={rating} size={18} />
        </View>
      ) : null}

      {/* Divider */}
      <View style={s.divider} />

      {/* Review body */}
      <Text style={s.body}>{body}</Text>

      {/* Branding */}
      <View style={s.footer}>
        <Text style={s.brand}>lexa</Text>
        <Text style={s.url}>
          {bookId ? `lexareads.app/book/${bookId}` : 'lexareads.app'}
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: W,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 44,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: fixed.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fontFamily.sansSemiBold
  },
  headerMeta: {
    flex: 1,
    minWidth: 0
  },
  displayName: {
    color: rawLight.text,
    fontSize: 16,
    fontFamily: fontFamily.sansSemiBold
  },
  username: {
    color: rawLight.t2,
    fontSize: 11,
    fontFamily: fontFamily.sans
  },
  miniCover: {
    width: 36,
    height: 54,
    borderRadius: 3,
    flexShrink: 0
  },
  bookTitle: {
    color: rawLight.t2,
    fontSize: 12,
    fontFamily: fontFamily.serifItalic,
    marginBottom: 6
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  divider: {
    height: 1,
    backgroundColor: rawLight.border,
    marginBottom: 14
  },
  body: {
    color: rawLight.t2,
    fontSize: 16,
    fontFamily: fontFamily.serif,
    lineHeight: 25,
    marginBottom: 20
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  brand: {
    color: fixed.accent,
    fontSize: 13,
    fontFamily: fontFamily.serifItalic
  },
  url: {
    color: rawLight.t2,
    fontSize: 9,
    fontFamily: fontFamily.sans
  }
})
