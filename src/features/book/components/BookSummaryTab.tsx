import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import { alpha, useColors } from '~/theme/colors'
import { ReadingRecordControls } from '~/features/library/components/ReadingRecordControls'
import { BookCoverModeration } from './BookCoverModeration'
import { BookCoverVote } from './BookCoverVote'
import { catalogFacetsQueryOptions } from '../catalog.queries'
import type { Tables } from '~/types/database'

// Distingue los apartados de la ficha sin cambiar la tipografía del sistema.
function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-2.5">
      {children}
    </Text>
  )
}

interface BookSummaryTabProps {
  book: Tables<'books'>
  onWriteReview: () => void
}

// Reúne el registro personal compartido, la sinopsis y los datos de esta edición.
export function BookSummaryTab({ book, onWriteReview }: BookSummaryTabProps) {
  const c = useColors()
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
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
  ].filter((r) => r.value)

  return (
    <View className="pb-6">
      <View className="px-container py-4 border-b border-border">
        <ReadingRecordControls bookId={book.id} />
      </View>
      <BookCoverModeration bookId={book.id} />
      {extended.cover_vote_ends_at && (
        <BookCoverVote
          bookId={book.id}
          endsAt={extended.cover_vote_ends_at}
          finalizedAt={extended.cover_finalized_at ?? null}
        />
      )}

      {/* Genres */}
      {book.genres && book.genres.length > 0 && (
        <View
          className="px-container py-4 border-b"
          style={{ borderBottomColor: alpha(c.border, 0.55) }}
        >
          <View className="flex-row flex-wrap gap-1.5">
            {book.genres.map((g) => (
              <Text
                key={g}
                className="font-body text-xs text-t3 bg-surface border border-border rounded-md px-3 py-[5px]"
              >
                {termLabel('genre', g)}
              </Text>
            ))}
          </View>
        </View>
      )}

      {bookTags.length > 0 && (
        <View className="px-container py-4 border-b border-border">
          <SectionLabel>{t('search.tags')}</SectionLabel>
          <View className="flex-row flex-wrap gap-2">
            {bookTags.map((tag) => (
              <Text
                key={tag}
                className="font-body text-xs text-t2 bg-surface rounded-md px-3 py-2"
              >
                {termLabel('tag', tag)}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Synopsis */}
      {description && (
        <View
          className="px-container py-4 border-b"
          style={{ borderBottomColor: alpha(c.border, 0.55) }}
        >
          <SectionLabel>{t('book.synopsis')}</SectionLabel>
          <Text
            className="font-body text-xs text-t2 mb-2"
            style={{ lineHeight: 13.5 * 1.76 }}
            numberOfLines={expanded ? undefined : 5}
          >
            {description}
          </Text>
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <Text className="font-body-md text-xs text-accent">
              {expanded ? t('book.readLess') : t('book.readMore')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <View
          className="px-container py-4 border-b"
          style={{ borderBottomColor: alpha(c.border, 0.55) }}
        >
          <SectionLabel>{t('book.details')}</SectionLabel>
          <View className="rounded-card overflow-hidden border border-border bg-surface">
            {detailRows.map((row, i) => (
              <View
                key={row.label}
                className="flex-row justify-between items-center px-4 border-b border-border"
                style={{
                  paddingVertical: 11,
                  borderBottomWidth: i < detailRows.length - 1 ? 1 : 0
                }}
              >
                <Text className="font-body text-xs text-t3">{row.label}</Text>
                <Text className="font-body-md text-xs text-text">
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Write review CTA */}
      <View className="px-container pt-4">
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          className="py-3.5 rounded-card bg-accent items-center"
        >
          <Text className="font-body-sb text-sm text-white tracking-tight">
            {t('book.writeMyReview')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
