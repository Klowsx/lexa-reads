// Edge Function: send-push
// Triggered via Supabase webhook on notifications INSERT.
// Reads recipient's push token and sends via Expo push API.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

type NotificationType =
  | 'new_follower'
  | 'review_like'
  | 'activity_like'
  | 'comment_received'
  | 'reading_challenge_completed'
  | 'recommendation_received'
  | 'dm_request'
  | 'dm_message'
  | 'club_message'
  | 'club_join_request'

// Compone mensajes genéricos: nunca incluye el contenido de mensajes privados.
function buildMessage(
  type: NotificationType,
  actorUsername?: string
): { title: string; body: string } {
  const actor = actorUsername ? `@${actorUsername}` : 'Alguien'
  const map: Record<NotificationType, { title: string; body: string }> = {
    new_follower: { title: 'Lexa', body: `${actor} te empezó a seguir` },
    review_like: {
      title: 'Lexa',
      body: `${actor} le dio me gusta a tu reseña`
    },
    activity_like: {
      title: 'Lexa',
      body: `${actor} le dio me gusta a tu publicación`
    },
    comment_received: {
      title: 'Lexa',
      body: `${actor} comentó en tu publicación`
    },
    reading_challenge_completed: {
      title: '¡Meta cumplida! 🎉',
      body: 'Completaste tu desafío de lectura'
    },
    recommendation_received: {
      title: 'Lexa',
      body: `${actor} te recomendó un libro`
    },
    dm_request: { title: 'Lexa', body: `${actor} quiere enviarte mensajes` },
    dm_message: { title: actor, body: 'Te envió un mensaje' },
    club_message: { title: 'Lexa', body: `Nuevo mensaje en tu club` },
    club_join_request: {
      title: 'Lexa',
      body: `${actor} quiere unirse a tu club`
    }
  }
  return map[type] ?? { title: 'Lexa', body: 'Tienes una nueva notificación' }
}

// Valida el webhook y relee la notificación persistida antes de consultar consentimiento o enviar.
Deno.serve(async (req) => {
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 })
  const signature = req.headers.get('x-push-signature')
  const issuedAtHeader = req.headers.get('x-push-issued-at')
  if (
    !signature ||
    !/^[0-9a-f]{64}$/.test(signature) ||
    !issuedAtHeader ||
    !/^[0-9]{1,12}$/.test(issuedAtHeader)
  ) {
    return new Response('Forbidden', { status: 403 })
  }
  const issuedAt = Number(issuedAtHeader)
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return new Response('Unavailable', { status: 503 })
  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    let payload
    try {
      payload = await req.json()
    } catch {
      return new Response('Invalid event', { status: 400 })
    }
    const notificationId = payload?.record?.id
    if (
      payload?.type !== 'INSERT' ||
      payload?.table !== 'notifications' ||
      payload?.schema !== 'public' ||
      typeof notificationId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        notificationId
      )
    ) {
      return new Response('Invalid event', { status: 400 })
    }
    // La firma liga ID y fecha: la cola transporta un evento acotado, nunca el secreto de Vault.
    const verified = await supabaseAdmin.rpc('verify_push_webhook_event', {
      p_notification_id: notificationId,
      p_issued_at: issuedAt,
      p_signature: signature
    })
    if (verified.error) return new Response('Unavailable', { status: 503 })
    if (verified.data !== true)
      return new Response('Forbidden', { status: 403 })
    const notification = await supabaseAdmin
      .from('notifications')
      .select(
        'id, recipient_id, actor_id, type, reference_id, reference_type, read_at'
      )
      .eq('id', notificationId)
      .maybeSingle()
    if (notification.error) return new Response('Unavailable', { status: 503 })
    if (!notification.data || notification.data.read_at)
      return new Response('Skipped', { status: 200 })
    const { id, recipient_id, actor_id, type, reference_id, reference_type } =
      notification.data
    const prefKey = {
      new_follower: 'push_new_follower',
      review_like: 'push_review_like',
      activity_like: 'push_activity_like',
      comment_received: 'push_comment',
      reading_challenge_completed: 'push_recommendation',
      recommendation_received: 'push_recommendation',
      dm_request: 'push_dm',
      dm_message: 'push_dm',
      club_message: 'push_club',
      club_join_request: 'push_club'
    } as const satisfies Record<NotificationType, string>
    if (!Object.prototype.hasOwnProperty.call(prefKey, type))
      return new Response('Skipped', { status: 200 })
    const preferences = await supabaseAdmin
      .from('notification_preferences')
      .select(
        'consent_given_at, push_token, push_new_follower, push_activity_like, push_review_like, push_comment, push_recommendation, push_dm, push_club'
      )
      .eq('user_id', recipient_id)
      .maybeSingle()
    if (preferences.error) return new Response('Unavailable', { status: 503 })
    const prefs = preferences.data
    const pushToken = prefs?.push_token
    if (
      !prefs?.consent_given_at ||
      prefs?.[prefKey[type as NotificationType]] !== true ||
      typeof pushToken !== 'string' ||
      !/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(pushToken)
    ) {
      return new Response('Skipped', { status: 200 })
    }
    // Revalida las cuentas y los bloqueos al consumir la cola, no solo cuando nació el evento.
    const recipient = await supabaseAdmin
      .from('users')
      .select('id, deleted_at')
      .eq('id', recipient_id)
      .maybeSingle()
    if (recipient.error) return new Response('Unavailable', { status: 503 })
    if (!recipient.data || recipient.data.deleted_at)
      return new Response('Skipped', { status: 200 })
    let actorUsername: string | undefined
    if (actor_id) {
      const actor = await supabaseAdmin
        .from('users')
        .select('username, deleted_at')
        .eq('id', actor_id)
        .maybeSingle()
      if (actor.error) return new Response('Unavailable', { status: 503 })
      if (!actor.data || actor.data.deleted_at)
        return new Response('Skipped', { status: 200 })
      const blocks = await supabaseAdmin
        .from('user_blocks')
        .select('id')
        .or(
          `and(blocker_id.eq.${actor_id},blocked_id.eq.${recipient_id}),and(blocker_id.eq.${recipient_id},blocked_id.eq.${actor_id})`
        )
        .limit(1)
      if (blocks.error) return new Response('Unavailable', { status: 503 })
      if (!blocks.data || blocks.data.length > 0)
        return new Response('Skipped', { status: 200 })
      actorUsername = actor.data.username
    }
    const { title, body } = buildMessage(
      type as NotificationType,
      actorUsername
    )
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: {
          notificationId: id,
          type,
          referenceId: reference_id,
          referenceType: reference_type
        },
        sound: 'default'
      })
    })
    if (!response.ok)
      return new Response('Push provider unavailable', { status: 502 })
    const result = await response.json()
    const ticket = Array.isArray(result?.data) ? result.data[0] : result?.data
    // Solo DeviceNotRegistered invalida un token; credenciales y sender ID pertenecen a configuración.
    if (
      ticket?.status === 'error' &&
      ticket?.details?.error === 'DeviceNotRegistered'
    ) {
      const cleanup = await supabaseAdmin
        .from('notification_preferences')
        .update({ push_token: null })
        .eq('user_id', recipient_id)
        .eq('push_token', pushToken)
      if (cleanup.error)
        return new Response('Token cleanup failed', { status: 503 })
      return new Response('Unregistered device', { status: 200 })
    }
    if (ticket?.status !== 'ok')
      return new Response('Push provider rejected delivery', { status: 502 })
    // La respuesta no expone tokens, payload del proveedor ni datos de otras personas.
    return new Response('Accepted', { status: 200 })
  } catch {
    return new Response('Invalid request or unavailable service', {
      status: 500
    })
  }
})
