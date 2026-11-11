import { useIsMutating, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Star,
  StarHalf
} from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native'
import { Skeleton } from '~/components/ui/Skeleton'
import { STATUS_META, STATUS_ORDER, type BookStatus } from '~/lib/book-status'
import { cn } from '~/lib/utils'
import { useAuthStore } from '~/stores/auth.store'
import { alpha, useColors } from '~/theme/colors'
import type { UpsertUserBookParams } from '~/types'
import { useUpsertUserBook } from '../hooks/useUpsertUserBook'
import { useUserBook } from '../hooks/useUserBook'
import { readingRecordMutationOptions } from '../library.queries'
import {
  localReadingDate,
  validateReadingDates,
  type ReadingDates
} from '../reading-record'

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

// Ofrece los mismos estados y una puntuación editable en todas las entradas de un libro.
export function ReadingRecordControls({ bookId }: { bookId: string }) {
  const { t } = useTranslation()
  const c = useColors()
  const client = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const query = useUserBook(bookId)
  const save = useUpsertUserBook(bookId)
  const writing =
    useIsMutating({
      mutationKey: readingRecordMutationOptions(userId, bookId).mutationKey
    }) > 0
  const [editingDates, setEditingDates] = useState(false)
  const record = query.data
  const status = record?.status ?? null
  const rating = record?.rating ?? null

  // Comprueba también la caché de forma síncrona para ignorar dobles pulsaciones antes del render.
  function commitChanges(
    changes: Omit<UpsertUserBookParams, 'bookId'>,
    onSuccess?: () => void
  ) {
    if (
      client.isMutating({
        mutationKey: readingRecordMutationOptions(userId, bookId).mutationKey
      })
    )
      return
    save.mutate({ bookId, ...changes }, { onSuccess })
  }

  // Cambiar el estado activo es una operación inocua; quitar un libro nunca se oculta en ese gesto.
  function changeStatus(next: BookStatus) {
    if (writing || status === next) return
    commitChanges({ status: next })
  }

  // La segunda pulsación elige media estrella; retirar la nota tiene una acción propia.
  function changeRating(star: number) {
    if (writing) return
    commitChanges({ rating: rating === star ? star - 0.5 : star })
  }

  if (query.isPending)
    return (
      <View accessibilityLabel={t('common.loading')} className="gap-3">
        <Skeleton height={48} animate={false} />
        <Skeleton height={48} animate={false} />
      </View>
    )
  if (query.isError)
    return (
      <View className="gap-2">
        <Text accessibilityRole="alert" className="font-body text-xs text-text">
          {t('reading.loadError')}
        </Text>
        <Pressable
          onPress={() => void query.refetch()}
          accessibilityRole="button"
          className={cn('min-h-12 justify-center rounded-md bg-sr px-4', focus)}
        >
          <Text className="font-body-sb text-xs text-text">
            {t('common.retry')}
          </Text>
        </Pressable>
      </View>
    )

  return (
    <View className="gap-5">
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-body-sb text-sm text-text"
        >
          {t('reading.status')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {STATUS_ORDER.map((item) => {
            const active = status === item
            return (
              <Pressable
                key={item}
                onPress={() => changeStatus(item)}
                disabled={writing}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: writing }}
                aria-selected={active}
                aria-disabled={writing}
                style={
                  active
                    ? {
                        borderColor: c.status[STATUS_META[item].colorRole],
                        backgroundColor: alpha(
                          c.status[STATUS_META[item].colorRole],
                          0.12
                        )
                      }
                    : undefined
                }
                className={cn(
                  'min-h-12 flex-row items-center gap-2 rounded-full border border-border bg-surface px-4 py-3 active:opacity-70',
                  focus,
                  writing && 'opacity-50'
                )}
              >
                {active && <Check size={18} color={c.text} />}
                <Text
                  className={cn(
                    'text-xs text-text',
                    active ? 'font-body-sb' : 'font-body'
                  )}
                >
                  {t(STATUS_META[item].labelKey)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="font-body-sb text-sm text-text"
        >
          {t('reading.rating')}
        </Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row">
            {[1, 2, 3, 4, 5].map((star) => {
              const half = rating === star - 0.5
              const Icon = half ? StarHalf : Star
              return (
                <Pressable
                  key={star}
                  onPress={() => changeRating(star)}
                  disabled={writing}
                  accessibilityRole="button"
                  accessibilityLabel={t('reading.rateValue', {
                    value: rating === star ? star - 0.5 : star
                  })}
                  accessibilityState={{
                    selected: rating === star || half,
                    disabled: writing
                  }}
                  aria-disabled={writing}
                  className={cn(
                    'h-12 w-12 items-center justify-center rounded-md active:bg-sr',
                    focus
                  )}
                >
                  <Icon
                    size={28}
                    color={c.text}
                    fill={
                      rating != null && rating >= star - 0.5 ? c.star : 'none'
                    }
                    strokeWidth={1.5}
                  />
                </Pressable>
              )
            })}
          </View>
          {rating != null && (
            <Text className="font-body-sb text-xs text-text">{rating}/5</Text>
          )}
        </View>
        <Text className="font-body text-xs text-t2">
          {t('reading.ratingHint')}
        </Text>
        {rating != null && (
          <Pressable
            onPress={() => commitChanges({ rating: null })}
            disabled={writing}
            accessibilityRole="button"
            accessibilityState={{ disabled: writing }}
            className={cn(
              'min-h-12 self-start justify-center rounded-md px-2 active:bg-sr',
              focus
            )}
          >
            <Text className="font-body-sb text-xs text-text">
              {t('reading.removeRating')}
            </Text>
          </Pressable>
        )}
      </View>
      {record && status !== 'want_to_read' && (
        <View className="gap-2 border-t border-border pt-3">
          <Pressable
            onPress={() => setEditingDates(!editingDates)}
            disabled={writing}
            accessibilityRole="button"
            accessibilityLabel={t('reading.editDates')}
            accessibilityState={{ expanded: editingDates, disabled: writing }}
            aria-expanded={editingDates}
            className={cn(
              'min-h-12 flex-row items-center gap-3 rounded-md active:bg-sr',
              focus
            )}
          >
            <CalendarDays size={22} color={c.t2} />
            <View className="flex-1 gap-1">
              <Text className="font-body-sb text-xs text-text">
                {t('reading.dates')}
              </Text>
              <Text className="font-body text-xs text-t2">
                {status === 'read'
                  ? (record.finished_at ?? t('reading.dateUnknown'))
                  : (record.started_at ?? t('reading.dateUnknown'))}
              </Text>
            </View>
            <ChevronDown
              size={20}
              color={c.text}
              style={{
                transform: [{ rotate: editingDates ? '180deg' : '0deg' }]
              }}
            />
          </Pressable>
          {status === 'read' && (
            <Text className="font-body text-xs text-t2">
              {record.finished_at
                ? t('reading.goalYear', {
                    year: record.finished_at.slice(0, 4)
                  })
                : t('reading.goalMissingDate')}
            </Text>
          )}
          {editingDates && (
            <ReadingDateForm
              key={`${status}:${record.id}`}
              status={status!}
              initial={{
                started_at: record.started_at,
                finished_at: record.finished_at
              }}
              disabled={writing}
              onSave={(dates) =>
                commitChanges(dates, () => setEditingDates(false))
              }
            />
          )}
        </View>
      )}
      <View accessibilityLiveRegion="polite">
        {writing ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color={c.text} />
            <Text className="font-body text-xs text-t2">
              {t('reading.saving')}
            </Text>
          </View>
        ) : save.isError ? (
          <Text
            accessibilityRole="alert"
            className="font-body text-xs text-text"
          >
            {t('reading.saveError')}
          </Text>
        ) : save.isSuccess ? (
          <View className="flex-row items-center gap-2">
            <Check size={18} color={c.text} />
            <Text className="font-body text-xs text-text">
              {t('reading.saved')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

// Mantiene un borrador de fechas y guarda ambas juntas para no enviar intervalos incompletos.
function ReadingDateForm({
  status,
  initial,
  disabled,
  onSave
}: {
  status: BookStatus
  initial: ReadingDates
  disabled: boolean
  onSave: (dates: ReadingDates) => void
}) {
  const { t } = useTranslation()
  const c = useColors()
  const [started, setStarted] = useState(initial.started_at ?? '')
  const [finished, setFinished] = useState(initial.finished_at ?? '')
  const dates = {
    started_at: started.trim() || null,
    finished_at: status === 'read' ? finished.trim() || null : null
  }
  const validation = validateReadingDates(status, dates)
  const dirty =
    dates.started_at !== initial.started_at ||
    dates.finished_at !== initial.finished_at
  return (
    <View className="gap-3 pt-2">
      <Text className="font-body text-xs text-t2">{t('reading.dateHint')}</Text>
      {(
        ['started_at', ...(status === 'read' ? ['finished_at'] : [])] as const
      ).map((field) => {
        const isStart = field === 'started_at'
        const label = t(isStart ? 'reading.started' : 'reading.finished')
        const value = isStart ? started : finished
        const setValue = isStart ? setStarted : setFinished
        return (
          <View key={field} className="gap-2">
            <Text className="font-body-sb text-xs text-text">{label}</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              editable={!disabled}
              accessibilityLabel={label}
              aria-invalid={dirty && !!validation}
              placeholder={t('stitch.catalog.datePlaceholder')}
              placeholderTextColor={c.t2}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
              keyboardType="numbers-and-punctuation"
              className="min-h-12 rounded-md border border-border bg-bg px-3 py-3 font-body text-base text-text outline-none focus:border-accent"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setValue(localReadingDate())}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={t('reading.todayFor', { field: label })}
                className={cn('min-h-12 justify-center rounded-md px-2', focus)}
              >
                <Text className="font-body-sb text-xs text-text">
                  {t('reading.today')}
                </Text>
              </Pressable>
              {isStart && value ? (
                <Pressable
                  onPress={() => setStarted('')}
                  disabled={disabled}
                  accessibilityRole="button"
                  className={cn(
                    'min-h-12 justify-center rounded-md px-2',
                    focus
                  )}
                >
                  <Text className="font-body text-xs text-t2">
                    {t('reading.removeStart')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )
      })}
      {dirty && validation && (
        <Text accessibilityRole="alert" className="font-body text-xs text-text">
          {t(`reading.errors.${validation}`)}
        </Text>
      )}
      <Pressable
        onPress={() => onSave(dates)}
        disabled={disabled || !!validation || !dirty}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || !!validation || !dirty }}
        className={cn(
          'min-h-12 items-center justify-center rounded-md bg-sr px-4 py-3',
          focus,
          (disabled || !!validation || !dirty) && 'opacity-50'
        )}
      >
        <Text className="font-body-sb text-xs text-text">
          {t('reading.saveDates')}
        </Text>
      </Pressable>
    </View>
  )
}
