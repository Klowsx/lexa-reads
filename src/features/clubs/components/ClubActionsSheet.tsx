import { useState } from 'react'
import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { StitchButton } from '~/components/ui/StitchButton'
import { StitchSheet } from '~/components/ui/StitchSheet'
import { useStitchTheme } from '~/theme/stitch'
import { useClubMembership } from '../hooks/useClubMembership'

// Ofrece las acciones existentes del club y protege la salida con confirmación y reintento.
export function ClubActionsSheet({
  clubId,
  clubName,
  onReport,
  onClose
}: {
  clubId: string
  clubName: string
  onReport: () => void
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const membership = useClubMembership()
  const c = useStitchTheme()
  const { t } = useTranslation()

  // Mantiene el diálogo abierto si no se pudo abandonar el club.
  function leave() {
    if (!membership.isPending)
      membership.mutate({ clubId, action: 'leave' }, { onSuccess: onClose })
  }

  return (
    <StitchSheet
      title={t(confirming ? 'clubStates.leaveTitle' : 'clubStates.options')}
      onClose={onClose}
      busy={membership.isPending}
    >
      <Text
        style={{
          fontFamily: c.heading,
          fontSize: 22,
          lineHeight: 28,
          color: c.text
        }}
      >
        {clubName}
      </Text>
      {confirming ? (
        <>
          <Text
            style={{
              fontFamily: c.body,
              fontSize: 16,
              lineHeight: 24,
              color: c.secondary
            }}
          >
            {t('clubStates.leaveHint')}
          </Text>
          {membership.isError && (
            <Text
              accessibilityRole="alert"
              style={{ fontFamily: c.body, fontSize: 16, color: c.error }}
            >
              {t('clubStates.leaveError')}
            </Text>
          )}
          <StitchButton
            label={t('clubStates.leave')}
            onPress={leave}
            destructive
            loading={membership.isPending}
          />
          <StitchButton
            label={t('common.cancel')}
            onPress={() => {
              setConfirming(false)
              membership.reset()
            }}
            secondary
            disabled={membership.isPending}
          />
        </>
      ) : (
        <>
          <StitchButton
            label={t('clubStates.leave')}
            onPress={() => setConfirming(true)}
            secondary
          />
          <StitchButton
            label={t('clubStates.report')}
            onPress={() => {
              onClose()
              onReport()
            }}
            secondary
          />
        </>
      )}
    </StitchSheet>
  )
}
