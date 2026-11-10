import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, MoreVertical, Users } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ChatThread } from '~/features/chat/components/ChatThread'
import { ReportSheet } from '~/features/user/components/ReportSheet'
import { useClub } from '~/features/clubs/hooks/useClub'
import { useClubMembership } from '~/features/clubs/hooks/useClubMembership'
import type { ClubDetail } from '~/features/clubs/clubs.queries'
import { useColors } from '~/theme/colors'
import { useTranslation } from 'react-i18next'
import { StitchFeedback } from '~/components/ui/StitchFeedback'
import { StitchLoading } from '~/components/ui/StitchLoading'
import { ClubActionsSheet } from '~/features/clubs/components/ClubActionsSheet'

// Distingue el acceso al club, la espera de membresía y los fallos recuperables sin inventar permisos.
export default function ClubScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [reporting, setReporting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const { t } = useTranslation()

  const query = useClub(slug ?? '')
  const { data: club, isPending: isLoading } = query
  const membership = useClubMembership()

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <StitchLoading />
      </View>
    )
  }

  if (query.isError && !club) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <StitchFeedback
          kind="error"
          title={t('clubStates.loadError')}
          message={t('communityStates.retryHint')}
          action={{
            label: t('common.retry'),
            onPress: () => {
              void query.refetch()
            }
          }}
          busy={query.isFetching}
        />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="min-h-12 items-center justify-center"
        >
          <Text className="font-body text-sm text-text">
            {t('common.back')}
          </Text>
        </Pressable>
      </View>
    )
  }

  if (!club) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <StitchFeedback
          kind="private"
          title={t('clubStates.unavailable')}
          message={t('communityStates.unavailableHint')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </View>
    )
  }

  const isMember = club.myState === 'active'

  if (isMember && !club.conversationId) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <StitchFeedback
          kind="error"
          title={t('clubStates.chatUnavailable')}
          message={t('clubStates.chatUnavailableHint')}
          action={{
            label: t('common.retry'),
            onPress: () => {
              void query.refetch()
            }
          }}
          busy={query.isFetching}
        />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="min-h-12 items-center justify-center"
        >
          <Text className="font-body text-sm text-text">
            {t('common.back')}
          </Text>
        </Pressable>
      </View>
    )
  }

  // ── Vista de miembro: chat del club ──
  if (isMember && club.conversationId) {
    const header = (
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2.5">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <View className="flex-1 min-w-0">
          <Text
            className="font-display-sb text-lg text-text tracking-tight"
            numberOfLines={1}
          >
            {club.name}
          </Text>
          <Text className="text-[11px] font-body text-t3">
            {club.members_count}{' '}
            {club.members_count === 1 ? 'miembro' : 'miembros'}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => setShowActions(true)}
          accessibilityRole="button"
          accessibilityLabel="Opciones del club"
        >
          <MoreVertical size={20} color={c.t3} strokeWidth={1.8} />
        </Pressable>
      </View>
    )

    return (
      <>
        <ChatThread
          key={club.conversationId}
          conversationId={club.conversationId}
          header={header}
          showSender
        />
        {showActions && (
          <ClubActionsSheet
            clubId={club.id}
            clubName={club.name}
            onClose={() => setShowActions(false)}
            onReport={() => setReporting(true)}
          />
        )}
        {reporting && (
          <ReportSheet
            targetType="club"
            targetId={club.id}
            targetName={club.name}
            onClose={() => setReporting(false)}
          />
        )}
      </>
    )
  }

  // ── Vista de no-miembro: info + acción ──
  // Cancela una solicitud pendiente una sola vez y conserva el estado si falla.
  function leave() {
    if (membership.isPending) return
    membership.mutate({ clubId: club!.id, action: 'leave' })
  }
  // Elige la acción según la membresía confirmada, respetando invitaciones y acceso privado.
  function primaryAction() {
    if (membership.isPending) return
    const action =
      club!.myState === 'invited'
        ? 'accept-invite'
        : club!.myState === 'pending'
          ? 'leave'
          : 'join'
    membership.mutate({ clubId: club!.id, action })
  }

  const cta = ctaFor(club, membership.isPending)

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text
          className="font-display-sb text-xl text-text tracking-tight flex-1"
          numberOfLines={1}
        >
          {club.name}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, alignItems: 'center', gap: 14 }}
      >
        {club.current_book?.cover_url ? (
          <Image
            source={{ uri: club.current_book.cover_url }}
            style={{ width: 80, height: 116, borderRadius: 6 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-[80px] h-[116px] rounded-md bg-sh items-center justify-center">
            <Users size={28} color={c.t3} strokeWidth={1.5} />
          </View>
        )}
        <Text className="font-display-sb text-2xl text-text text-center tracking-tight">
          {club.name}
        </Text>
        <Text className="text-xs font-body text-t3">
          {club.members_count}{' '}
          {club.members_count === 1 ? 'miembro' : 'miembros'} ·{' '}
          {club.visibility === 'private' ? 'Privado' : 'Público'}
        </Text>
        {club.description && (
          <Text className="text-sm font-body text-t2 text-center leading-[21px]">
            {club.description}
          </Text>
        )}

        <Pressable
          onPress={cta.disabled ? undefined : primaryAction}
          disabled={cta.disabled}
          className="mt-2 py-3 px-10 rounded-md items-center bg-accent"
          style={{ opacity: cta.disabled ? 0.4 : 1 }}
          accessibilityRole="button"
          accessibilityLabel={cta.label}
        >
          {membership.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-body-sb text-white">{cta.label}</Text>
          )}
        </Pressable>

        {club.myState === 'pending' && (
          <Pressable
            onPress={leave}
            disabled={membership.isPending}
            accessibilityRole="button"
            accessibilityLabel="Cancelar solicitud"
          >
            <Text className="text-xs font-body-md text-t3">
              Cancelar solicitud
            </Text>
          </Pressable>
        )}
        {membership.isError && (
          <StitchFeedback
            kind="error"
            title={t('clubStates.membershipError')}
            message={t('clubStates.membershipHint')}
          />
        )}
      </ScrollView>
    </View>
  )
}

// Traduce la membresía a una única acción y bloquea los estados que no permiten incorporarse.
function ctaFor(
  club: ClubDetail,
  pending: boolean
): { label: string; disabled: boolean } {
  if (club.myState === 'banned')
    return { label: 'No disponible', disabled: true }
  if (club.myState === 'pending')
    return { label: 'Solicitud pendiente', disabled: true }
  if (club.myState === 'invited')
    return { label: 'Aceptar invitación', disabled: pending }
  if (club.visibility === 'private')
    return { label: 'Solicitar unirse', disabled: pending }
  return { label: 'Unirse', disabled: pending }
}
