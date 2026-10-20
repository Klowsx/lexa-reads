import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import { alpha, useColors } from '~/theme/colors'
import { ReadingRecordControls } from '~/features/library/components/ReadingRecordControls'
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
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const detailRows = [
    { label: t('book.detail.publisher'), value: book.publisher },
    { label: t('book.detail.published'), value: book.published_date },
    { label: t('book.detail.language'), value: book.language?.toUpperCase() },
    { label: t('book.detail.pages'), value: book.page_count?.toString() },
    { label: t('book.detail.isbn13'), value: book.isbn_13 }
  ].filter((r) => r.value)

  return (
    <View className="pb-6">
      <View className="px-container py-4 border-b border-border">
        <ReadingRecordControls bookId={book.id} />
      </View>

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
                {g}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Synopsis */}
      {book.description && (
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
            {book.description}
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
