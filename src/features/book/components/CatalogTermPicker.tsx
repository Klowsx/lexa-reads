import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, TextInput, View } from 'react-native'
import type { CatalogFacet } from '../catalog.queries'
import { useColors } from '~/theme/colors'

type Kind = 'genre' | 'tag'

// Compara términos sin mayúsculas ni tildes para sugerir la opción ya registrada.
function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

// Detecta errores tipográficos pequeños sin mezclar términos de longitud muy distinta.
function near(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 2 || left[0] !== right[0])
    return false
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i++) {
    const next = [i]
    for (let j = 1; j <= right.length; j++) {
      next[j] = Math.min(
        next[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + Number(left[i - 1] !== right[j - 1])
      )
    }
    previous = next
  }
  return previous[right.length] <= 2
}

// Reutiliza la elección múltiple y las sugerencias existentes para categorías y etiquetas.
export function CatalogTermPicker({
  kind,
  title,
  selected,
  onChange,
  facets,
  max
}: {
  kind: Kind
  title: string
  selected: string[]
  onChange: (values: string[]) => void
  facets: CatalogFacet[]
  max: number
}) {
  const { t, i18n } = useTranslation()
  const c = useColors()
  const [input, setInput] = useState('')
  const query = normalize(input)
  const options = facets.filter((facet) => facet.kind === kind)
  const matches = query
    ? options
        .filter((facet) => {
          const labels = [facet.value, facet.label_es, facet.label_en].filter(
            (value): value is string => !!value
          )
          return labels.some((value) => {
            const candidate = normalize(value)
            return (
              candidate.includes(query) ||
              (query.length >= 4 && near(query, candidate))
            )
          })
        })
        .sort(
          (a, b) =>
            Number(normalize(b.value).startsWith(query)) -
            Number(normalize(a.value).startsWith(query))
        )
        .slice(0, 6)
    : []
  const exact = options.find((facet) =>
    [facet.value, facet.label_es, facet.label_en].some(
      (value) => value && normalize(value) === query
    )
  )

  // Añade el término canónico, o propone uno nuevo cuando no existe una coincidencia exacta.
  function add(value: string) {
    const resolved =
      options.find((facet) =>
        [facet.value, facet.label_es, facet.label_en].some(
          (label) => label && normalize(label) === normalize(value)
        )
      )?.value ?? value.trim()
    if (
      !resolved ||
      selected.some((item) => normalize(item) === normalize(resolved)) ||
      selected.length >= max
    )
      return
    onChange([...selected, resolved])
    setInput('')
  }

  return (
    <View className="gap-2">
      <Text className="font-body-sb text-xs text-text">{title}</Text>
      {selected.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {selected.map((value) => {
            const facet = options.find((item) => item.value === value)
            const label =
              (i18n.language.startsWith('en')
                ? facet?.label_en
                : facet?.label_es) || value
            return (
              <Pressable
                key={value}
                onPress={() =>
                  onChange(selected.filter((item) => item !== value))
                }
                accessibilityRole="button"
                accessibilityLabel={t('createBook.removeTerm', {
                  value: label
                })}
                className="min-h-12 justify-center rounded-full bg-sr px-4"
              >
                <Text className="font-body-sb text-xs text-accent">
                  {label} ×
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}
      <TextInput
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => {
          if (exact) add(exact.value)
          else if (matches.length === 0) add(input)
        }}
        accessibilityLabel={title}
        placeholder={t('createBook.findOrAdd')}
        placeholderTextColor={c.t2}
        maxLength={60}
        returnKeyType="done"
        className="min-h-14 rounded-md border border-border bg-surface px-4 font-body text-base text-text"
      />
      {!!query && (
        <View className="overflow-hidden rounded-md border border-border bg-surface">
          {matches.map((facet) => {
            const label =
              (i18n.language.startsWith('en')
                ? facet.label_en
                : facet.label_es) || facet.value
            return (
              <Pressable
                key={facet.value}
                onPress={() => add(facet.value)}
                accessibilityRole="button"
                className="min-h-12 justify-center border-b border-border px-4"
              >
                <Text className="font-body text-xs text-text">{label}</Text>
              </Pressable>
            )
          })}
          {!exact && selected.length < max && (
            <Pressable
              onPress={() => add(input)}
              accessibilityRole="button"
              className="min-h-12 justify-center px-4"
            >
              <Text className="font-body-sb text-xs text-accent">
                {t('createBook.addTerm', { value: input.trim() })}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      <Text className="font-body text-xs text-t2">
        {t('createBook.termLimit', { count: max })}
      </Text>
    </View>
  )
}
