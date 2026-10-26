import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookCover } from '~/components/ui/BookCover'
import { catalogFacetsQueryOptions } from '../catalog.queries'
import { CatalogTermPicker } from '../components/CatalogTermPicker'
import { useCreateBook } from '../hooks/useCreateBook'
import { useSearchBooks } from '../hooks/useSearchBook'
import { useDebounce } from '~/lib/useDebounce'
import { useAuthStore } from '~/stores/auth.store'
import { useColors } from '~/theme/colors'
import { pickBookCover } from '../pick-cover'
import { isIsbn13, normalizeIsbn13 } from '../isbn'

// Reúne datos bilingües, términos y propuestas antes de crear una ficha compartida.
export default function CreateBookScreen() {
  const router = useRouter()
  const { title: initialTitle, isbn: initialIsbn } = useLocalSearchParams<{
    title?: string
    isbn?: string
  }>()
  const { t, i18n } = useTranslation()
  const c = useColors()
  const insets = useSafeAreaInsets()
  const createBook = useCreateBook()
  const facets = useQuery(catalogFacetsQueryOptions())
  const userId = useAuthStore((s) => s.user?.id)
  const searchedIsbn = isIsbn13(initialIsbn ?? initialTitle ?? '')
  const [title, setTitle] = useState(searchedIsbn ? '' : (initialTitle ?? ''))
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState(
    searchedIsbn ? normalizeIsbn13(initialIsbn ?? initialTitle ?? '') : ''
  )
  const [genres, setGenres] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [descriptionEs, setDescriptionEs] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [publishedYear, setPublishedYear] = useState('')
  const [covers, setCovers] = useState<ImagePicker.ImagePickerAsset[]>([])
  const [error, setError] = useState('')
  const matches = useSearchBooks(useDebounce(title.trim(), 350))

  // Abre la galería y suma hasta tres propuestas de portada para la votación.
  async function selectCover() {
    try {
      const image = await pickBookCover()
      if (!image) return
      setError('')
      setCovers((current) =>
        current.length < 3 ? [...current, image] : current
      )
    } catch (cause) {
      setError(
        t(
          cause instanceof Error && cause.message === 'cover-too-large'
            ? 'createBook.coverTooLarge'
            : 'createBook.coverError'
        )
      )
    }
  }

  // Valida el formulario y solicita al hook que guarde la ficha y sus propuestas.
  async function saveBook() {
    const cleanTitle = title.trim()
    const cleanAuthor = author.trim()
    const cleanIsbn = normalizeIsbn13(isbn)
    if (!cleanTitle || !cleanAuthor) {
      setError(t('createBook.required'))
      return
    }
    if (cleanIsbn && cleanIsbn.length !== 13) {
      setError(t('createBook.invalidIsbn'))
      return
    }
    if (!descriptionEs.trim() && !descriptionEn.trim()) {
      setError(t('createBook.descriptionRequired'))
      return
    }
    const year = publishedYear ? Number(publishedYear) : null
    if (
      publishedYear &&
      (!/^\d{4}$/.test(publishedYear) || year! < 1000 || year! > 2100)
    ) {
      setError(t('createBook.invalidDetails'))
      return
    }
    if (!userId || createBook.isPending) return
    setError('')
    try {
      const book = await createBook.mutateAsync([
        {
          title: cleanTitle,
          author: cleanAuthor,
          isbn13: cleanIsbn || null,
          genres,
          tags,
          descriptionEs: descriptionEs.trim(),
          descriptionEn: descriptionEn.trim(),
          publishedYear: year,
          locale: i18n.language.startsWith('en') ? 'en' : 'es'
        },
        covers.map((cover) => cover.base64!).filter(Boolean),
        userId
      ])
      router.replace({ pathname: '/book/[id]', params: { id: book.id } })
    } catch {
      setError(t('createBook.saveError'))
    }
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-5 px-container py-6"
      >
        <Pressable
          onPress={() => router.back()}
          className="min-h-12 justify-center self-start"
        >
          <Text className="font-body-sb text-xs text-accent">
            {t('common.back')}
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          className="font-display-sb text-xl text-text"
        >
          {t('createBook.title')}
        </Text>
        <Text className="font-body text-xs text-t2">
          {t('createBook.sharedHint')}
        </Text>
        <View className="gap-3">
          {(
            [
              ['title', title, setTitle, t('createBook.bookTitle')],
              ['author', author, setAuthor, t('createBook.author')],
              ['isbn', isbn, setIsbn, t('createBook.isbn')]
            ] as const
          ).map(([key, value, change, label]) => (
            <View key={key} className="gap-2">
              <Text className="font-body-sb text-xs text-text">{label}</Text>
              <TextInput
                value={value}
                onChangeText={change}
                accessibilityLabel={label}
                keyboardType={key === 'isbn' ? 'numeric' : 'default'}
                maxLength={key === 'title' ? 500 : key === 'isbn' ? 20 : 200}
                placeholder={label}
                placeholderTextColor={c.t2}
                className="min-h-14 rounded-md border border-border bg-surface px-4 font-body text-xs text-text"
              />
              {key === 'title' && matches.data && matches.data.length > 0 && (
                <View className="gap-3 rounded-md border border-border bg-surface p-2">
                  <Text className="px-2 py-1 font-body-sb text-xs text-t2">
                    {t('createBook.possibleMatches')}
                  </Text>
                  {matches.data.slice(0, 3).map((book) => (
                    <Pressable
                      key={book.id}
                      accessibilityRole="button"
                      accessibilityLabel={t('search.openBook', {
                        title: book.title
                      })}
                      onPress={() =>
                        router.replace({
                          pathname: '/book/[id]',
                          params: { id: book.id }
                        })
                      }
                      className="min-h-14 flex-row items-center gap-3 rounded-md p-2 active:bg-sr"
                    >
                      <BookCover book={book} width={36} height={54} />
                      <View className="min-w-0 flex-1">
                        <Text
                          numberOfLines={1}
                          className="font-display-sb text-sm text-text"
                        >
                          {book.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="font-body text-xs text-t2"
                        >
                          {book.authors?.[0]}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
        <CatalogTermPicker
          kind="genre"
          title={t('createBook.genres')}
          selected={genres}
          onChange={setGenres}
          facets={facets.data ?? []}
          max={8}
        />
        <CatalogTermPicker
          kind="tag"
          title={t('createBook.tags')}
          selected={tags}
          onChange={setTags}
          facets={facets.data ?? []}
          max={12}
        />
        {facets.isError && (
          <Pressable
            onPress={() => void facets.refetch()}
            accessibilityRole="button"
            className="min-h-11 justify-center"
          >
            <Text className="font-body-sb text-xs text-accent">
              {t('common.retry')}
            </Text>
          </Pressable>
        )}
        <View className="gap-3">
          <Text className="font-body-sb text-xs text-text">
            {t('createBook.descriptionHint')}
          </Text>
          {(
            [
              [descriptionEs, setDescriptionEs, t('createBook.descriptionEs')],
              [descriptionEn, setDescriptionEn, t('createBook.descriptionEn')]
            ] as const
          ).map(([value, change, label]) => (
            <View key={label} className="gap-2">
              <Text className="font-body-sb text-xs text-text">{label}</Text>
              <TextInput
                multiline
                value={value}
                onChangeText={change}
                accessibilityLabel={label}
                maxLength={5000}
                placeholder={label}
                placeholderTextColor={c.t2}
                textAlignVertical="top"
                className="min-h-28 rounded-md border border-border bg-surface px-4 py-3 font-body text-xs text-text"
              />
            </View>
          ))}
        </View>
        <View className="gap-2">
          <Text className="font-body-sb text-xs text-text">
            {t('createBook.publishedYear')}
          </Text>
          <TextInput
            value={publishedYear}
            onChangeText={setPublishedYear}
            accessibilityLabel={t('createBook.publishedYear')}
            keyboardType="number-pad"
            maxLength={4}
            placeholder={t('createBook.publishedYear')}
            placeholderTextColor={c.t2}
            className="min-h-14 rounded-md border border-border bg-surface px-4 font-body text-xs text-text"
          />
        </View>
        <View className="gap-3">
          <Text className="font-body-sb text-xs text-text">
            {t('createBook.cover')}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {covers.map((cover) => (
              <Pressable
                key={cover.uri}
                onPress={() =>
                  setCovers((current) =>
                    current.filter((item) => item.uri !== cover.uri)
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={t('createBook.removeCover')}
              >
                <Image
                  source={{ uri: cover.uri }}
                  style={{ width: 96, height: 144, borderRadius: 5 }}
                />
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={selectCover}
            disabled={covers.length >= 3}
            accessibilityRole="button"
            accessibilityState={{ disabled: covers.length >= 3 }}
            className="min-h-12 items-center justify-center rounded-md bg-surface px-4 disabled:opacity-50"
          >
            <Text className="font-body-sb text-xs text-text">
              {t('createBook.chooseCover')}
            </Text>
          </Pressable>
          <Text className="font-body text-xs text-t2">
            {t('createBook.coverOptional')}
          </Text>
        </View>
        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            className="font-body text-xs text-error"
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={saveBook}
          disabled={createBook.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: createBook.isPending }}
          className="min-h-12 items-center justify-center rounded-md bg-accent px-4 disabled:opacity-50"
        >
          <Text className="font-body-sb text-xs text-white">
            {t(createBook.isPending ? 'createBook.saving' : 'createBook.save')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
