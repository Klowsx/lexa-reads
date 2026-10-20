import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { fixed } from '~/theme/colors'
import type { Tables } from '~/types/database'

// Dimensiones fijas para la tarjeta de compartir — aspect ratio ~3:4
const W = 320
const H = 430
const COVER_W = 110
const COVER_H = 165
const BG = '#1C1208'

interface BookShareCardProps {
  book: Tables<'books'>
  rating?: number | null
  username?: string | null
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={s.ratingRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i
        const half = !filled && rating >= i - 0.5
        return (
          <Text
            key={i}
            style={[s.star, { color: filled || half ? fixed.star : '#444' }]}
          >
            {half ? '½' : '★'}
          </Text>
        )
      })}
      <Text style={s.ratingValue}>{rating.toFixed(1)}</Text>
    </View>
  )
}

export function BookShareCard({ book, rating, username }: BookShareCardProps) {
  const author = book.authors?.[0] ?? ''

  return (
    <View style={s.card}>
      {/* Accent stripe */}
      <View style={s.stripe} />

      {/* Cover */}
      <View style={s.shadow}>
        {book.cover_url ? (
          <Image
            source={{ uri: book.cover_url }}
            style={s.cover}
            contentFit="cover"
          />
        ) : (
          <View style={[s.cover, s.coverFallback]}>
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

      {rating != null && <Stars rating={rating} />}

      {username ? <Text style={s.username}>leído por @{username}</Text> : null}

      {/* Branding */}
      <View style={s.footer}>
        <Text style={s.brand}>lexa</Text>
        <Text style={s.url}>
          lexareads.app/book/{book.google_books_id ?? book.id}
        </Text>
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
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: fixed.accent
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.85,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
    marginBottom: 20
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 5
  },
  coverFallback: {
    backgroundColor: '#3D2B1F',
    justifyContent: 'flex-end',
    padding: 8
  },
  coverText: {
    color: 'rgba(240,234,226,0.82)',
    fontSize: 9,
    fontFamily: 'PlayfairDisplay_400Regular',
    lineHeight: 13
  },
  title: {
    color: '#F0EAE2',
    fontSize: 17,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 23,
    marginBottom: 5
  },
  author: {
    color: 'rgba(240,234,226,0.5)',
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginBottom: 10
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  star: {
    fontSize: 15,
    marginHorizontal: 1
  },
  ratingValue: {
    color: 'rgba(240,234,226,0.5)',
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    marginLeft: 5
  },
  username: {
    color: 'rgba(240,234,226,0.35)',
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
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
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    letterSpacing: 0.4
  },
  url: {
    color: 'rgba(240,234,226,0.25)',
    fontSize: 9,
    fontFamily: 'DMSans_400Regular'
  }
})
