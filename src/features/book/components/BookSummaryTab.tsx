import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, PenLine } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '~/theme/colors'
import { BookCoverModeration } from './BookCoverModeration'
import { BookCoverVote } from './BookCoverVote'
import { catalogFacetsQueryOptions } from '../catalog.queries'
import type { Tables } from '~/types/database'

interface BookSummaryTabProps {
  book: Tables<'books'>
  onWriteReview: () => void
}

// Prioriza la sinopsis y permite consultar los datos y la portada sin duplicar el editor de lectura.
export function BookSummaryTab({ book, onWriteReview }: BookSummaryTabProps) {
  const c = useColors()
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [showCoverVote, setShowCoverVote] = useState(false)
  const facets = useQuery(catalogFacetsQueryOptions())
  const extended = book as Tables<'books'> & {
    tags?: string[]
    description_es?: string | null
    description_en?: string | null
    cover_vote_ends_at?: string | null
    cover_finalized_at?: string | null
  }
  const bookTags = extended.tags ?? []
  const description = i18n.language.startsWith('en')
    ? extended.description_en || extended.description_es || book.description
    : extended.description_es || extended.description_en || book.description

  // Muestra la traducción disponible de cada término y conserva el valor canónico como respaldo.
  function termLabel(kind: 'genre' | 'tag', value: string) {
    const facet = facets.data?.find(
      (item) => item.kind === kind && item.value === value
    )
    return (
      (i18n.language.startsWith('en') ? facet?.label_en : facet?.label_es) ||
      value
    )
  }

  const detailRows = [
    { label: t('book.detail.publisher'), value: book.publisher },
    {
      label: t('book.detail.published'),
      value: book.published_date || book.published_year?.toString()
    },
    { label: t('book.detail.pages'), value: book.page_count?.toString() },
    { label: t('book.detail.isbn13'), value: book.isbn_13 }
  ].filter((row) => row.value)

  return (
    <View className="gap-6 py-6">
      {!!book.genres?.length && (
        <View className="flex-row flex-wrap gap-2 px-container">
          {book.genres.map((genre) => (
            <Text
              key={genre}
              className="rounded-full bg-surface px-3 py-2 font-body text-xs text-t2"
            >
              {termLabel('genre', genre)}
            </Text>
          ))}
        </View>
      )}

      {!!description && (
        <View className="px-container">
          <Text
            accessibilityRole="header"
            className="mb-3 font-display-sb text-md text-text"
          >
            {t('book.synopsis')}
          </Text>
          <Text
            selectable
            className="font-body text-sm leading-7 text-text"
            numberOfLines={expanded ? undefined : 5}
          >
            {description}
          </Text>
          <Pressable
            onPress={() => setExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            aria-expanded={expanded}
            className="mt-2 min-h-12 justify-center self-start rounded-md px-2 active:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Text className="font-body-sb text-xs text-text">
              {expanded ? t('book.readLess') : t('book.readMore')}
            </Text>
          </Pressable>
        </View>
      )}

      <View className="px-container">
        <Pressable
          onPress={onWriteReview}
          accessibilityRole="button"
          className="min-h-14 flex-row items-center gap-3 rounded-md bg-surface px-4 py-3 active:bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <PenLine size={21} color={c.text} />
          <Text className="flex-1 font-body-sb text-xs text-text">
            {t('book.writeMyReview')}
          </Text>
          <ChevronRight size={20} color={c.t2} />
        </Pressable>
      </View>

      {detailRows.length > 0 && (
        <View className="px-container">
          <Text
            accessibilityRole="header"
            className="mb-3 font-display-sb text-md text-text"
          >
            {t('book.details')}
          </Text>
          <View className="rounded-card bg-surface px-4">
            {detailRows.map((row, index) => (
              <View
                key={row.label}
                className="flex-row flex-wrap items-start justify-between gap-x-4 gap-y-1 border-border py-4"
                style={{ borderTopWidth: index > 0 ? 1 : 0 }}
              >
                <Text className="font-body text-xs text-t2">{row.label}</Text>
                <Text
                  selectable
                  className="min-w-0 flex-shrink font-body-md text-xs text-text"
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {bookTags.length > 0 && (
        <View className="gap-3 px-container">
          <Text
            accessibilityRole="header"
            className="font-body-sb text-xs text-text"
          >
            {t('search.tags')}
          </Text>
          <Text className="font-body text-xs leading-6 text-t2">
            {bookTags.map((tag) => termLabel('tag', tag)).join(' · ')}
          </Text>
        </View>
      )}

      {/* La participación en portadas sigue visible, pero sus controles se despliegan a petición. */}
      {extended.cover_vote_ends_at && (
        <View className="border-t border-border">
          <Pressable
            onPress={() => setShowCoverVote((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showCoverVote }}
            aria-expanded={showCoverVote}
            className="min-h-14 flex-row items-center gap-3 px-container py-4 active:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Text className="flex-1 font-body-sb text-xs text-text">
              {t('book.coverVoteTitle')}
            </Text>
            {showCoverVote ? (
              <ChevronDown size={20} color={c.t2} />
            ) : (
              <ChevronRight size={20} color={c.t2} />
            )}
          </Pressable>
          {showCoverVote && (
            <BookCoverVote
              bookId={book.id}
              endsAt={extended.cover_vote_ends_at}
              finalizedAt={extended.cover_finalized_at ?? null}
            />
          )}
        </View>
      )}
      <BookCoverModeration bookId={book.id} />
    </View>
  )
}
