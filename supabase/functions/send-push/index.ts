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

Deno.serve(async (req) => {
  // Verificación de origen: este endpoint es público, así que solo aceptamos
  // invocaciones del Database Webhook que conozcan el secreto compartido.
  // Sin esto, cualquiera podría POSTear un `record` arbitrario y disparar
  // push notifications suplantando a otros usuarios.
  const secret = Deno.env.get('WEBHOOK_SECRET')
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const payload = await req.json()
    // Supabase webhook sends { type, table, record, ... }
    const record = payload?.record
    if (!record) return new Response('No record', { status: 400 })

    const { id, recipient_id, actor_id, type, reference_id, reference_type } =
      record

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch recipient push token and preference for this notification type
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select(
        'push_token, push_new_follower, push_activity_like, push_review_like, push_comment, push_recommendation, push_dm, push_club'
      )
      .eq('user_id', recipient_id)
      .single()

    const pushToken = (prefs as any)?.push_token as string | null
    if (!pushToken || pushToken === 'declined') {
      return new Response('No push token', { status: 200 })
    }

    // Check per-type preference
    const prefKey: Record<NotificationType, string> = {
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
    }
    const prefField = prefKey[type as NotificationType]
    if (prefField && (prefs as any)?.[prefField] === false) {
      return new Response('Preference disabled', { status: 200 })
    }

    // Get actor username for the message
    let actorUsername: string | undefined
    if (actor_id) {
      const { data: actor } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', actor_id)
        .single()
      actorUsername = actor?.username
    }

    const { title, body } = buildMessage(
      type as NotificationType,
      actorUsername
    )

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const result = await res.json()

    // Ciclo de vida del token: Expo devuelve un "ticket" por mensaje. Si el
    // ticket viene con error DeviceNotRegistered / InvalidCredentials, el token
    // está muerto → lo limpiamos para no seguir intentando (token rot).
    // Nota: DeviceNotRegistered también puede llegar DESPUÉS, en el "receipt"
    // (asíncrono). Limpiarlo del todo requiere un job programado que consulte
    // los receipts por ticket-id; aquí cubrimos el caso síncrono del ticket.
    const ticket = Array.isArray((result as any)?.data)
      ? (result as any).data[0]
      : (result as any)?.data
    const deadTokenErrors = [
      'DeviceNotRegistered',
      'InvalidCredentials',
      'MismatchSenderId'
    ]
    if (
      ticket?.status === 'error' &&
      deadTokenErrors.includes(ticket?.details?.error)
    ) {
      await supabaseAdmin
        .from('notification_preferences')
        .update({ push_token: null })
        .eq('user_id', recipient_id)
        .eq('push_token', pushToken)
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('send-push error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
