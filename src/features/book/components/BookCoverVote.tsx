import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import {
  bookCoverBallotOptions,
  proposeBookCover,
  voteBookCover
} from '../catalog.queries'
import { pickBookCover } from '../pick-cover'
import { useAuthStore } from '~/stores/auth.store'

// Permite proponer y votar portadas mientras la ficha mantenga su votación abierta.
export function BookCoverVote({
  bookId,
  endsAt,
  finalizedAt
}: {
  bookId: string
  endsAt: string
  finalizedAt: string | null
}) {
  const { t, i18n } = useTranslation()
  const userId = useAuthStore((state) => state.user?.id ?? '')
  const client = useQueryClient()
  const ballot = useQuery(bookCoverBallotOptions(bookId))
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState('')
  const open = !finalizedAt && now < Date.parse(endsAt)
  const canPropose =
    (ballot.data ?? []).filter((candidate) => candidate.added_by === userId)
      .length < 3
  const vote = useMutation({
    mutationFn: (candidateId: string) =>
      voteBookCover(bookId, candidateId, userId),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ['book', bookId, 'cover-ballot']
      })
  })
  const propose = useMutation({
    mutationFn: (base64: string) => proposeBookCover(bookId, base64, userId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['book', bookId] })
      void client.invalidateQueries({ queryKey: ['books'] })
    }
  })

  // Actualiza el cierre visible aunque el lector mantenga la ficha abierta.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Carga una propuesta nueva y muestra los errores sin perder la ficha.
  async function addCover() {
    try {
      const image = await pickBookCover()
      if (!image?.base64) return
      await propose.mutateAsync(image.base64)
      setError('')
    } catch {
      setError(t('book.coverVoteError'))
    }
  }

  // Cambia el voto propio y refresca los resultados agregados.
  async function castVote(candidateId: string) {
    try {
      await vote.mutateAsync(candidateId)
      setError('')
    } catch {
      setError(t('book.coverVoteError'))
    }
  }

  return (
    <View className="gap-3 border-b border-border px-container py-4">
      <Text className="font-display-sb text-lg text-text">
        {t('book.coverVoteTitle')}
      </Text>
      <Text className="font-body text-xs text-t2">
        {open
          ? t('book.coverVoteUntil', {
              date: new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium'
              }).format(new Date(endsAt))
            })
          : t(finalizedAt ? 'book.coverVoteClosed' : 'book.coverVoteAwaiting')}
      </Text>
      {ballot.isError && (
        <Pressable
          onPress={() => void ballot.refetch()}
          accessibilityRole="button"
        >
          <Text className="font-body-sb text-xs text-accent">
            {t('common.retry')}
          </Text>
        </Pressable>
      )}
      {ballot.isSuccess && ballot.data.length === 0 && (
        <Text className="font-body text-xs text-t2">
          {t('book.noCoverProposals')}
        </Text>
      )}
      <View className="gap-3">
        {(ballot.data ?? []).map((candidate) => (
          <View
            key={candidate.id}
            className="flex-row items-center gap-5 rounded-card bg-surface p-4"
          >
            <Image
              source={{ uri: candidate.cover_url }}
              style={{ width: 88, height: 132, borderRadius: 6 }}
              contentFit="cover"
            />
            <View className="flex-1 gap-4">
              <Text className="font-display-sb text-lg text-text">
                {t('book.coverVotes', { count: candidate.votes })}
              </Text>
              {open && (
                <Pressable
                  onPress={() => void castVote(candidate.id)}
                  disabled={vote.isPending || candidate.selected_by_me}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: candidate.selected_by_me,
                    disabled: vote.isPending
                  }}
                  className={
                    candidate.selected_by_me
                      ? 'min-h-12 items-center justify-center rounded-full bg-sr px-4'
                      : 'min-h-12 items-center justify-center rounded-full border border-border bg-bg px-4'
                  }
                >
                  <Text
                    className={
                      candidate.selected_by_me
                        ? 'font-body-sb text-xs text-accent'
                        : 'font-body-sb text-xs text-text'
                    }
                  >
                    {t(
                      candidate.selected_by_me
                        ? 'book.coverVoted'
                        : 'book.coverVote'
                    )}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
      {open && canPropose && (
        <Pressable
          onPress={() => void addCover()}
          disabled={propose.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: propose.isPending }}
          className="min-h-12 items-center justify-center rounded-md bg-surface px-4"
        >
          <Text className="font-body-sb text-xs text-text">
            {t('book.proposeCover')}
          </Text>
        </Pressable>
      )}
      {!!error && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-xs text-error"
        >
          {error}
        </Text>
      )}
    </View>
  )
}
