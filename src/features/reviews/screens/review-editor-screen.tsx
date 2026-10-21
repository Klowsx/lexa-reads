import { useQuery } from '@tanstack/react-query'
import { reviewBookQueryOptions } from '~/features/book/book.queries'
import { Skeleton } from '~/components/ui/Skeleton'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { z } from 'zod'
import { useMyReview } from '~/features/book/hooks/useMyReview'
import { useUpsertReview } from '~/features/book/hooks/useUpsertReview'
import { MAX_REVIEW_LENGTH } from '~/lib/content-limits'
import { useColors } from '~/theme/colors'

// ─── Validación con Zod ───────────────────────────────────────

// El body requiere al menos 10 caracteres para forzar una reseña
// mínimamente útil en lugar de "muy bueno" o similar, y un tope que
// refleja el CHECK de DB (016_content_length_limits.sql).
// El schema se construye dentro del componente (useMemo) para que los
// mensajes de error pasen por i18n.
type ReviewFormValues = {
  body: string
  containsSpoilers: boolean
}

// ─── Pantalla ─────────────────────────────────────────────────

// Publica o edita una reseña sin perder el borrador ante errores o refetches de fondo.
export default function NewReviewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const c = useColors()
  const { t } = useTranslation()

  const reviewSchema = useMemo(
    () =>
      z.object({
        body: z
          .string()
          .trim()
          .min(10, t('book.reviewMin'))
          .max(
            MAX_REVIEW_LENGTH,
            t('book.reviewMax', { max: MAX_REVIEW_LENGTH })
          ),
        containsSpoilers: z.boolean()
      }),
    [t]
  )

  // bookId viene de la URL: /review/new?bookId=xxx
  const { bookId } = useLocalSearchParams<{ bookId: string }>()

  // Cargamos la reseña existente para precargarlo si es una edición.
  const reviewQuery = useMyReview(bookId ?? '')
  const { data: existingReview, isLoading: loadingReview } = reviewQuery
  const bookQuery = useQuery(reviewBookQueryOptions(bookId ?? ''))
  const posting = useRef(false)
  const [confirmLeaving, setConfirmLeaving] = useState(false)
  const isEditing = !!existingReview

  // Mutación para crear o actualizar — el hook decide INSERT vs UPDATE
  // basándose en si params.reviewId está presente.
  const upsertMutation = useUpsertReview(bookId ?? '')

  // react-hook-form con zod como resolver de validación.
  // defaultValues vacíos inicialmente; reset() los rellena cuando carga existingReview.
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    reset
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { body: '', containsSpoilers: false },
    // revalidamos en cada cambio para que el botón se active en tiempo real
    mode: 'onChange'
  })

  useEffect(() => {
    if (existingReview && !isDirty) {
      reset({
        body: existingReview.body,
        containsSpoilers: existingReview.contains_spoilers ?? false
      })
    }
  }, [existingReview, isDirty, reset])

  const bodyValue = watch('body')
  const charCount = bodyValue?.length ?? 0

  // Confirma primero la carga de la reseña y envía una sola escritura por gesto.
  function onSubmit(values: ReviewFormValues) {
    if (
      !bookId ||
      reviewQuery.isError ||
      bookQuery.isError ||
      posting.current ||
      upsertMutation.isPending
    )
      return
    posting.current = true

    upsertMutation.mutate(
      {
        bookId,
        body: values.body,
        containsSpoilers: values.containsSpoilers,
        // Si existe reseña → edición; si no → creación.
        reviewId: existingReview?.id,
        userBookId: existingReview?.user_book_id ?? undefined
      },
      {
        // onSuccess al nivel de la llamada: volvemos atrás solo si hay éxito.
        // Los errores ya los maneja queryClient.defaultOptions.mutations.onError
        // mostrando un toast automático.
        onSuccess: finishEditing,
        onSettled: () => {
          posting.current = false
        }
      }
    )
  }

  // Al entrar desde un enlace directo también ofrece un destino válido después de guardar o cerrar.
  function finishEditing() {
    if (router.canGoBack()) router.back()
    else if (bookQuery.data)
      router.replace({
        pathname: '/book/[id]',
        params: { id: bookQuery.data.id }
      })
    else router.replace('/(tabs)/feed')
  }

  // Pide confirmar antes de descartar un borrador desde el botón de cierre del editor.
  function requestClose() {
    if (upsertMutation.isPending) return
    if (isDirty) setConfirmLeaving(true)
    else finishEditing()
  }

  // Mostramos un spinner mientras cargamos la reseña existente para
  // no mostrar el formulario en blanco antes de precargarlo.
  if (bookId && (loadingReview || bookQuery.isPending)) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <View className="w-full gap-4 px-container">
          <Skeleton height={48} animate={false} />
          <Skeleton height={180} animate={false} />
        </View>
      </View>
    )
  }

  if (!bookId || reviewQuery.isError || bookQuery.isError)
    return (
      <View className="flex-1 justify-center gap-4 bg-bg px-container">
        <Text accessibilityRole="alert" className="font-body text-sm text-text">
          {t('reviews.editorLoadError')}
        </Text>
        <Pressable
          onPress={() => {
            void reviewQuery.refetch()
            void bookQuery.refetch()
          }}
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-md bg-sr px-4"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('common.retry')}
          </Text>
        </Pressable>
        <Pressable
          onPress={finishEditing}
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-md px-4"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('common.back')}
          </Text>
        </Pressable>
      </View>
    )

  return (
    // Stack.Screen permite configurar la presentación de esta ruta
    // como un modal nativo sin modificar _layout.tsx.
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />

      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="w-full max-w-2xl flex-1 self-center"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* Drag handle — apariencia de sheet */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-3 pb-4">
            <Text className="font-display-sb text-md text-text">
              {isEditing ? t('book.editReview') : t('book.writeReview')}
            </Text>
            <Pressable
              onPress={requestClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              className="h-12 w-12 items-center justify-center rounded-md active:bg-sr"
            >
              {/* Símbolo × más legible que un icono de lucide para cerrar */}
              <Text className="text-lg font-body text-t2">×</Text>
            </Pressable>
          </View>

          <View className="gap-3 px-container">
            <Text className="font-display-sb text-lg text-text">
              {bookQuery.data?.title}
            </Text>
            <Text className="font-body text-xs text-t2">
              {bookQuery.data?.authors?.join(', ')}
            </Text>
            {/* ── Texto de la reseña ──────────────────────── */}
            <View className="mb-4">
              <Text className="text-xs font-body-sb text-t3 uppercase tracking-widest mb-1.5">
                {t('book.yourReview')}
              </Text>

              <Controller
                control={control}
                name="body"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    accessibilityLabel={t('book.yourReview')}
                    editable={!upsertMutation.isPending}
                    aria-invalid={!!errors.body}
                    multiline
                    maxLength={MAX_REVIEW_LENGTH}
                    // ~8 líneas de altura mínima para invitar a escribir más
                    numberOfLines={8}
                    placeholder={t('book.reviewPlaceholder')}
                    placeholderTextColor={c.t2}
                    className="rounded-card bg-sr border text-text font-body text-sm px-[14px] py-3 min-h-[160px]"
                    style={{
                      // textAlignVertical top para que el cursor empiece arriba
                      textAlignVertical: 'top',
                      // Borde de error en rojo si hay validación fallida
                      borderColor: errors.body ? c.error : c.border
                    }}
                  />
                )}
              />

              {/* Contador de caracteres + mensaje de error */}
              <View className="flex-row justify-between mt-1">
                {errors.body ? (
                  <Text className="text-xs font-body text-error">
                    {errors.body.message}
                  </Text>
                ) : (
                  <View />
                )}
                <Text className="text-xs font-body text-t3">
                  {t('book.charsCount', { count: charCount })}
                </Text>
              </View>
            </View>

            {/* ── Toggle spoilers ──────────────────────────── */}
            <Controller
              control={control}
              name="containsSpoilers"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row justify-between items-center mb-6 py-3 px-4 rounded-card bg-sr border border-border">
                  <View className="flex-1 mr-3">
                    <Text className="font-body-md text-sm text-text">
                      {t('book.spoilers')}
                    </Text>
                    <Text className="font-body text-xs text-t3 mt-0.5">
                      {t('book.spoilerToggleDesc')}
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    disabled={upsertMutation.isPending}
                    accessibilityLabel={t('book.spoilers')}
                    onValueChange={onChange}
                    // Colores del toggle adaptados al tema de la app
                    trackColor={{ false: c.sh, true: c.accent }}
                    thumbColor={value ? '#fff' : c.t3}
                  />
                </View>
              )}
            />

            {upsertMutation.isError && (
              <Text
                accessibilityRole="alert"
                className="font-body text-xs text-text"
              >
                {t('reviews.saveError')}
              </Text>
            )}
            {/* ── Botón publicar ───────────────────────────── */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              // El botón se desactiva mientras se envía o si el form no es válido
              disabled={upsertMutation.isPending || !isValid}
              accessibilityRole="button"
              accessibilityState={{
                disabled: upsertMutation.isPending || !isValid
              }}
              className="min-h-12 py-3.5 rounded-card items-center bg-sr focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={{
                // Opacidad reducida cuando está desactivado para feedback visual
                opacity: upsertMutation.isPending || !isValid ? 0.5 : 1
              }}
            >
              {upsertMutation.isPending ? (
                <ActivityIndicator color={c.text} size="small" />
              ) : (
                <Text className="font-body-sb text-sm text-text">
                  {isEditing
                    ? t('common.saveChanges')
                    : t('book.publishReview')}
                </Text>
              )}
            </Pressable>

            {/* Aviso sobre la política de edición */}
            <Text className="font-body text-xs text-t3 text-center mt-3">
              {t('book.editReviewPolicy')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {confirmLeaving && (
        <ConfirmDialog
          title={t('reviews.leaveTitle')}
          description={t('reviews.leaveHint')}
          confirmLabel={t('reviews.discard')}
          pending={false}
          onConfirm={finishEditing}
          onClose={() => setConfirmLeaving(false)}
        />
      )}
    </>
  )
}
