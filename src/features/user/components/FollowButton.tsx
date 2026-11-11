import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { ConfirmDialog } from '~/components/ui/ConfirmDialog'
import { useAuthStore } from '~/stores/auth.store'
import { useFollow } from '../hooks/useFollow'
import { useProfile } from '../hooks/useProfile'
import { useColors } from '~/theme/colors'

// Comparte seguimiento persistido, cancelación, confirmación y errores entre perfiles y listados.
export function FollowButton({
  user
}: {
  user: { id: string; username: string; is_private: boolean | null }
}) {
  const { t } = useTranslation()
  const c = useColors()
  const own = useAuthStore((s) => s.user?.id === user.id)
  const profile = useProfile(own ? '' : user.username)
  const { follow, unfollow, busy } = useFollow(user.id, user.username)
  const [confirm, setConfirm] = useState(false)
  const status = profile.data?.follow_status
  if (own) return null
  // Espera la relación persistida y pide confirmación antes de dejar de seguir.
  function changeFollow() {
    if (busy) return
    follow.reset()
    unfollow.reset()
    if (profile.isError) {
      void profile.refetch()
      return
    }
    if (!profile.data) return
    if (status === 'accepted') setConfirm(true)
    else if (status === 'pending') unfollow.mutate()
    else follow.mutate()
  }
  return (
    <View className="gap-2">
      <Pressable
        onPress={changeFollow}
        disabled={
          busy || profile.isPending || (!profile.data && !profile.isError)
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: busy || profile.isPending, busy }}
        className="min-h-12 justify-center items-center rounded-md px-4 py-3 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        style={{ backgroundColor: status ? c.sr : c.accent }}
      >
        <Text
          className="font-body-sb text-sm"
          style={{ color: status ? c.text : c.onAccent }}
        >
          {t(
            busy
              ? 'common.loading'
              : profile.isError
                ? 'common.retry'
                : status === 'accepted'
                  ? 'common.following'
                  : status === 'pending'
                    ? 'social.cancelRequest'
                    : user.is_private
                      ? 'social.requestFollow'
                      : 'common.follow'
          )}
        </Text>
      </Pressable>
      {!confirm && (follow.isError || unfollow.isError) && (
        <Text accessibilityRole="alert" className="font-body text-xs text-text">
          {t('social.followError')}
        </Text>
      )}
      {confirm && (
        <ConfirmDialog
          title={t('social.unfollowTitle', { username: user.username })}
          description={t(
            user.is_private
              ? 'social.unfollowPrivateHint'
              : 'social.unfollowHint'
          )}
          confirmLabel={t('social.unfollow')}
          pending={busy}
          error={unfollow.isError ? t('social.followError') : undefined}
          onConfirm={() =>
            unfollow.mutate(undefined, { onSuccess: () => setConfirm(false) })
          }
          onClose={() => setConfirm(false)}
        />
      )}
    </View>
  )
}
