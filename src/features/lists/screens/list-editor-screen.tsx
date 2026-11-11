import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable
} from 'react-native'
import { Globe, Lock, Check } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ErrorState } from '~/components/ui/ErrorState'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { useAuthStore } from '~/stores/auth.store'
import { useColors, fixed } from '~/theme/colors'
import { useList } from '../hooks/useList'
import { useCreateList } from '../hooks/useCreateList'
import { useUpdateList } from '../hooks/useUpdateList'
import { ListAction, ListHeader, ListLoading } from '../components/ListControls'
import type { ListDetail } from '../list.queries'
import { cn } from '~/lib/utils'

// Resuelve permisos antes de montar el formulario para no mostrar datos editables de otro lector.
export default function ListEditorScreen() {
  const { slug, bookId, bookTitle } = useLocalSearchParams<{
    slug?: string
    bookId?: string
    bookTitle?: string
  }>()
  const query = useList(slug ?? ''),
    uid = useAuthStore((s) => s.user?.id),
    { t } = useTranslation(),
    insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {slug &&
        (query.isPending ||
          (query.isError && !query.data) ||
          !query.data ||
          query.data.user_id !== uid) && (
          <ListHeader title={t('lists.editTitle')} />
        )}
      {slug && query.isError && query.data && (
        <View className="gap-2 px-container py-2">
          <Text accessibilityRole="alert" className="font-body text-xs text-t2">
            {t('common.error')}
          </Text>
          <ListAction
            label={t('common.retry')}
            onPress={() => {
              void query.refetch()
            }}
          />
        </View>
      )}
      {slug && query.isPending ? (
        <ListLoading />
      ) : slug && query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : slug && (!query.data || query.data.user_id !== uid) ? (
        <ErrorState message={t('lists.notEditable')} />
      ) : (
        <ListForm
          key={query.data?.id ?? 'new'}
          list={slug ? (query.data ?? undefined) : undefined}
          bookId={bookId}
          bookTitle={bookTitle}
        />
      )}
    </KeyboardAvoidingView>
  )
}

// Crear y editar comparten validación; una recarga no reemplaza el borrador que ya se está escribiendo.
function ListForm({
  list,
  bookId,
  bookTitle
}: {
  list?: ListDetail
  bookId?: string
  bookTitle?: string
}) {
  const { t } = useTranslation(),
    c = useColors(),
    router = useRouter(),
    insets = useSafeAreaInsets()
  const [name, setName] = useState(list?.name ?? ''),
    [description, setDescription] = useState(list?.description ?? '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    list?.visibility ?? 'private'
  )
  const [discard, setDiscard] = useState(false)
  const create = useCreateList(),
    update = useUpdateList(list?.slug ?? '')
  const mutation = list ? update : create
  const valid =
    name.trim().length >= 2 &&
    name.trim().length <= 60 &&
    description.length <= 200
  const dirty =
    name !== (list?.name ?? '') ||
    description !== (list?.description ?? '') ||
    visibility !== (list?.visibility ?? 'private')
  // Guarda el borrador; el enlace permanece estable y los errores conservan todos los campos.
  function save() {
    if (!valid || mutation.isPending) return
    if (list)
      update.mutate(
        {
          listId: list.id,
          name: name.trim(),
          description: description.trim() || null,
          visibility
        },
        {
          onSuccess: () =>
            router.replace({
              pathname: '/list/[slug]',
              params: { slug: list.slug }
            })
        }
      )
    else
      create.mutate(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          visibility,
          accentColor: fixed.status.reading
        },
        {
          onSuccess: (created) => {
            if (bookId)
              router.replace({
                pathname: '/book/add-to-list',
                params: { bookId, bookTitle: bookTitle ?? '' }
              })
            else
              router.replace({
                pathname: '/list/[slug]',
                params: { slug: created.slug }
              })
          }
        }
      )
  }
  // Abandona el formulario desde su acción explícita, conservando una confirmación si hay cambios.
  function cancel() {
    if (dirty) setDiscard(true)
    else leave()
  }
  // Regresa al origen o al perfil cuando no hay historial de navegación.
  function leave() {
    if (router.canGoBack()) router.back()
    else router.replace('/profile')
  }
  return (
    <>
      <ListHeader
        title={t(list ? 'lists.editTitle' : 'lists.newTitle')}
        onBack={() => {
          if (!mutation.isPending) cancel()
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="w-full max-w-2xl self-center gap-6 px-container pt-7">
          <View className="gap-2">
            <Text
              accessibilityRole="header"
              className="font-display text-2xl text-text"
            >
              {t(list ? 'lists.editHeading' : 'lists.newHeading')}
            </Text>
            <Text className="font-body text-sm text-t2">
              {bookId
                ? t('lists.createForBook', { title: bookTitle })
                : t('lists.formHint')}
            </Text>
          </View>
          <View className="gap-2">
            <Text className="font-body-sb text-xs text-text">
              {t('lists.name')}
            </Text>
            <TextInput
              accessibilityLabel={t('lists.name')}
              value={name}
              onChangeText={setName}
              maxLength={60}
              editable={!mutation.isPending}
              placeholder={t('lists.nameExample')}
              placeholderTextColor={c.t2}
              className="min-h-12 rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text"
            />
            <Text className="font-body text-xs text-t2">
              {name.trim().length > 0 && name.trim().length < 2
                ? t('lists.nameHint')
                : name.length + '/60'}
            </Text>
          </View>
          <View className="gap-2">
            <Text className="font-body-sb text-xs text-text">
              {t('lists.description')} {t('lists.optional')}
            </Text>
            <TextInput
              accessibilityLabel={t('lists.description')}
              value={description}
              onChangeText={setDescription}
              editable={!mutation.isPending}
              multiline
              maxLength={200}
              placeholder={t('lists.descPlaceholder')}
              placeholderTextColor={c.t2}
              style={{ minHeight: 116, textAlignVertical: 'top' }}
              className="rounded-md border border-border bg-surface px-4 py-3 font-body text-base text-text"
            />
            <Text className="font-body text-xs text-t2">
              {description.length}/200
            </Text>
          </View>
          <View className="gap-2">
            <Text className="font-body-sb text-xs text-text">
              {t('lists.visibility')}
            </Text>
            {(['private', 'public'] as const).map((v) => {
              const selected = visibility === v,
                Icon = v === 'private' ? Lock : Globe
              return (
                <Pressable
                  key={v}
                  accessibilityRole="radio"
                  aria-checked={selected}
                  accessibilityLabel={t('lists.' + v)}
                  accessibilityState={{
                    checked: selected,
                    disabled: mutation.isPending
                  }}
                  disabled={mutation.isPending}
                  onPress={() => setVisibility(v)}
                  className={cn(
                    'min-h-12 flex-row items-start gap-3 rounded-md p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                    selected ? 'bg-sr' : 'bg-surface'
                  )}
                >
                  <Icon size={20} color={c.text} />
                  <View className="flex-1 gap-1">
                    <Text className="font-body-sb text-xs text-text">
                      {t('lists.' + v)}
                    </Text>
                    <Text className="font-body text-xs text-t2">
                      {t('lists.' + v + 'Hint')}
                    </Text>
                  </View>
                  {selected && <Check size={20} color={c.text} />}
                </Pressable>
              )
            })}
          </View>
          {mutation.isError && (
            <Text
              accessibilityRole="alert"
              className="font-body text-xs text-text"
            >
              {t('lists.saveError')}
            </Text>
          )}
          <ListAction
            label={t(list ? 'common.saveChanges' : 'lists.createList')}
            disabled={!valid || (!!list && !dirty)}
            pending={mutation.isPending}
            onPress={save}
          />
          <Pressable
            accessibilityRole="button"
            disabled={mutation.isPending}
            onPress={cancel}
            className="min-h-12 items-center justify-center rounded-md active:bg-sr"
          >
            <Text className="font-body-sb text-xs text-t2">
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      {discard && (
        <ConfirmDialog
          title={t('lists.discardTitle')}
          description={t('lists.discardHint')}
          pending={false}
          confirmLabel={t('lists.discard')}
          onConfirm={leave}
          onClose={() => setDiscard(false)}
        />
      )}
    </>
  )
}
