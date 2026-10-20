import { useRouter } from 'expo-router'
import { Check, X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { Avatar } from '~/components/ui/Avatar'
import { useColors } from '~/theme/colors'
import { useRespondToFollow } from '../hooks/useRespondToFollow'
import type { PendingRequest } from '../user.queries'
import { ProfileSectionHeading } from './ProfileSection'

// Conserva el estado de guardado y error junto a la solicitud que se está respondiendo.
function RequestRow({ request }: { request: PendingRequest }) {
  const router = useRouter()
  const c = useColors()
  const { t } = useTranslation()
  const { accept, reject } = useRespondToFollow()
  const busy = accept.isPending || reject.isPending
  // Evita respuestas duplicadas y permite reintentar la misma solicitud después de un fallo.
  function respond(approved: boolean) {
    if (busy) return
    accept.reset()
    reject.reset()
    if (approved) accept.mutate(request.follow_id)
    else reject.mutate(request.follow_id)
  }
  return (
    <View className="border-t border-border py-3 gap-2">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.openReader', {
            name: request.requester.username
          })}
          onPress={() =>
            router.push({
              pathname: '/user/[username]',
              params: { username: request.requester.username }
            })
          }
          className="min-h-12 flex-1 flex-row items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-accent"
        >
          <Avatar
            neutral
            displayName={request.requester.display_name}
            username={request.requester.username}
            avatarUrl={request.requester.avatar_url}
            size={44}
          />
          <View className="min-w-0 flex-1">
            <Text className="font-body-sb text-xs text-text" numberOfLines={1}>
              {request.requester.display_name || request.requester.username}
            </Text>
            <Text className="font-body text-xs text-t2" numberOfLines={1}>
              @{request.requester.username}
            </Text>
          </View>
        </Pressable>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('social.acceptRequest', {
            username: request.requester.username
          })}
          accessibilityState={{ disabled: busy }}
          onPress={() => respond(true)}
          className="h-12 w-12 items-center justify-center rounded-md bg-sr hover:bg-sh focus-visible:outline focus-visible:outline-accent"
        >
          <Check size={20} color={c.text} />
        </Pressable>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('social.rejectRequest', {
            username: request.requester.username
          })}
          accessibilityState={{ disabled: busy }}
          onPress={() => respond(false)}
          className="h-12 w-12 items-center justify-center rounded-md border border-border hover:bg-sr focus-visible:outline focus-visible:outline-accent"
        >
          <X size={20} color={c.text} />
        </Pressable>
      </View>
      {busy && (
        <Text
          accessibilityLiveRegion="polite"
          className="font-body text-xs text-t2"
        >
          {t('common.loading')}
        </Text>
      )}
      {(accept.isError || reject.isError) && (
        <Text accessibilityRole="alert" className="font-body text-xs text-text">
          {t('social.requestError')}
        </Text>
      )}
    </View>
  )
}

// Sitúa las solicitudes en el perfil propio, donde se concede o rechaza el acceso a una cuenta privada.
export function FollowRequestsSection({
  requests
}: {
  requests: PendingRequest[]
}) {
  const { t } = useTranslation()
  if (!requests.length) return null
  return (
    <View className="px-container mb-8">
      <ProfileSectionHeading title={t('profile.followRequests')} />
      <Text className="font-body text-xs text-t2 mb-3">
        {t('social.requestsHint')}
      </Text>
      {requests.map((request) => (
        <RequestRow key={request.follow_id} request={request} />
      ))}
    </View>
  )
}
