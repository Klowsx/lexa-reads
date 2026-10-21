import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { BottomSheet } from '~/components/ui/BottomSheet'
import {
  catalogFacetsQueryOptions,
  emptyCatalogFilters,
  type CatalogFilters
} from '~/features/book/catalog.queries'
import { useColors } from '~/theme/colors'

type Filters = Omit<CatalogFilters, 'search'>

// Permite preparar varios filtros y aplicarlos juntos sin perder la búsqueda actual.
export function CatalogFilterSheet({
  value,
  onApply,
  onClose
}: {
  value: Filters
  onApply: (filters: Filters) => void
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const c = useColors()
  const facets = useQuery(catalogFacetsQueryOptions())
  const [draft, setDraft] = useState<Filters>(value)
  const [genreSearch, setGenreSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [yearFrom, setYearFrom] = useState(value.yearFrom?.toString() ?? '')
  const [yearTo, setYearTo] = useState(value.yearTo?.toString() ?? '')
  const categories = (facets.data ?? []).filter(
    (item) =>
      item.kind === 'genre' &&
      [item.value, item.label_es, item.label_en].some((label) =>
        label
          ?.toLocaleLowerCase()
          .includes(genreSearch.trim().toLocaleLowerCase())
      )
  )
  const tags = (facets.data ?? []).filter(
    (item) =>
      item.kind === 'tag' &&
      [item.value, item.label_es, item.label_en].some((label) =>
        label
          ?.toLocaleLowerCase()
          .includes(tagSearch.trim().toLocaleLowerCase())
      )
  )

  // Alterna una opción dentro de su grupo sin modificar los filtros ya aplicados.
  function toggle(key: 'genres' | 'tags', option: string) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(option)
        ? current[key].filter((value) => value !== option)
        : [...current[key], option]
    }))
  }

  // Valida el rango de años antes de cerrar la hoja.
  function apply() {
    const from = yearFrom ? Number(yearFrom) : null
    const to = yearTo ? Number(yearTo) : null
    if (invalidYear) return
    onApply({ ...draft, yearFrom: from, yearTo: to })
  }

  const invalidYear = Boolean(
    (yearFrom &&
      (!/^\d{4}$/.test(yearFrom) ||
        Number(yearFrom) < 1000 ||
        Number(yearFrom) > 2100)) ||
    (yearTo &&
      (!/^\d{4}$/.test(yearTo) ||
        Number(yearTo) < 1000 ||
        Number(yearTo) > 2100)) ||
    (yearFrom && yearTo && Number(yearFrom) > Number(yearTo))
  )

  return (
    <BottomSheet title={t('search.filters')} onClose={onClose}>
      {(
        [
          [
            'genre',
            t('search.categories'),
            genreSearch,
            setGenreSearch,
            categories,
            draft.genres,
            'genres'
          ],
          [
            'tag',
            t('search.tags'),
            tagSearch,
            setTagSearch,
            tags,
            draft.tags,
            'tags'
          ]
        ] as const
      ).map(([key, title, search, setSearch, options, selected, field]) => (
        <View key={key} className="gap-3">
          <Text className="font-display-sb text-sm text-text">{title}</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t(
              key === 'genre' ? 'search.findCategory' : 'search.findTag'
            )}
            accessibilityLabel={t(
              key === 'genre' ? 'search.findCategory' : 'search.findTag'
            )}
            placeholderTextColor={c.t2}
            className="min-h-12 rounded-md border border-border bg-bg px-4 font-body text-xs text-text"
          />
          {facets.isLoading ? (
            <Text className="font-body text-xs text-t2">
              {t('search.searching')}
            </Text>
          ) : facets.isError ? (
            <Pressable
              onPress={() => void facets.refetch()}
              className="min-h-11 justify-center"
            >
              <Text className="font-body-sb text-xs text-accent">
                {t('common.retry')}
              </Text>
            </Pressable>
          ) : options.length === 0 ? (
            <Text className="font-body text-xs text-t2">
              {t('search.noFilterOptions')}
            </Text>
          ) : (
            <ScrollView
              nestedScrollEnabled
              style={{ maxHeight: 176 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row flex-wrap gap-2">
                {options.slice(0, 30).map((facet) => (
                  <Pressable
                    key={facet.value}
                    onPress={() => toggle(field, facet.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: selected.includes(facet.value)
                    }}
                    className={
                      selected.includes(facet.value)
                        ? 'min-h-11 justify-center rounded-full bg-sr px-4'
                        : 'min-h-11 justify-center rounded-full bg-bg px-4'
                    }
                  >
                    <Text
                      className={
                        selected.includes(facet.value)
                          ? 'font-body-sb text-xs text-accent'
                          : 'font-body text-xs text-text'
                      }
                    >
                      {(i18n.language.startsWith('en')
                        ? facet.label_en
                        : facet.label_es) || facet.value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {options.length > 30 && (
                <Text className="py-2 font-body text-xs text-t2">
                  {t('search.narrowOptions')}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      ))}
      <View className="gap-3">
        <Text className="font-display-sb text-sm text-text">
          {t('search.publicationYear')}
        </Text>
        <View className="flex-row gap-2">
          {(
            [
              [yearFrom, setYearFrom, t('search.yearFrom')],
              [yearTo, setYearTo, t('search.yearTo')]
            ] as const
          ).map(([current, change, label]) => (
            <TextInput
              key={label}
              value={current}
              onChangeText={change}
              keyboardType="number-pad"
              maxLength={4}
              placeholder={label}
              accessibilityLabel={label}
              placeholderTextColor={c.t2}
              className="min-h-12 flex-1 rounded-md border border-border bg-bg px-4 font-body text-xs text-text"
            />
          ))}
        </View>
        {invalidYear && (
          <Text className="font-body text-xs text-error">
            {t('search.invalidYear')}
          </Text>
        )}
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => {
            setDraft(emptyCatalogFilters)
            setYearFrom('')
            setYearTo('')
            setGenreSearch('')
            setTagSearch('')
          }}
          accessibilityRole="button"
          className="min-h-12 flex-1 items-center justify-center rounded-md bg-bg px-4"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('search.clearFilters')}
          </Text>
        </Pressable>
        <Pressable
          onPress={apply}
          disabled={invalidYear}
          accessibilityRole="button"
          accessibilityState={{ disabled: invalidYear }}
          className="min-h-12 flex-1 items-center justify-center rounded-md bg-accent px-4 disabled:opacity-50"
        >
          <Text className="font-body-sb text-xs text-white">
            {t('search.applyFilters')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}
