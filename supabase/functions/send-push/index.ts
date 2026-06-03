// Edge Function: send-push
// Triggered via Supabase webhook on notifications INSERT.
// Reads recipient's push token and sends via Expo push API.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type NotificationType =
  | "new_follower"
  | "review_like"
  | "activity_like"
  | "comment_received"
  | "reading_challenge_completed"
  | "recommendation_received";

function buildMessage(
  type: NotificationType,
  actorUsername?: string,
): { title: string; body: string } {
  const actor = actorUsername ? `@${actorUsername}` : "Alguien";
  const map: Record<NotificationType, { title: string; body: string }> = {
    new_follower:                { title: "Lexa", body: `${actor} te empezó a seguir`                   },
    review_like:                 { title: "Lexa", body: `${actor} le dio me gusta a tu reseña`          },
    activity_like:               { title: "Lexa", body: `${actor} le dio me gusta a tu publicación`     },
    comment_received:            { title: "Lexa", body: `${actor} comentó en tu publicación`            },
    reading_challenge_completed: { title: "¡Meta cumplida! 🎉", body: "Completaste tu desafío de lectura" },
    recommendation_received:     { title: "Lexa", body: `${actor} te recomendó un libro`                },
  };
  return map[type] ?? { title: "Lexa", body: "Tienes una nueva notificación" };
}

Deno.serve(async (req) => {
  // Verificación de origen: este endpoint es público, así que solo aceptamos
  // invocaciones del Database Webhook que conozcan el secreto compartido.
  // Sin esto, cualquiera podría POSTear un `record` arbitrario y disparar
  // push notifications suplantando a otros usuarios.
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = await req.json();
    // Supabase webhook sends { type, table, record, ... }
    const record = payload?.record;
    if (!record) return new Response("No record", { status: 400 });

    const { id, recipient_id, actor_id, type, reference_id, reference_type } = record;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch recipient push token and preference for this notification type
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("push_token, push_new_follower, push_activity_like, push_review_like, push_comment, push_recommendation")
      .eq("user_id", recipient_id)
      .single();

    const pushToken = (prefs as any)?.push_token as string | null;
    if (!pushToken || pushToken === "declined") {
      return new Response("No push token", { status: 200 });
    }

    // Check per-type preference
    const prefKey: Record<NotificationType, string> = {
      new_follower:                "push_new_follower",
      review_like:                 "push_review_like",
      activity_like:               "push_activity_like",
      comment_received:            "push_comment",
      reading_challenge_completed: "push_recommendation",
      recommendation_received:     "push_recommendation",
    };
    const prefField = prefKey[type as NotificationType];
    if (prefField && (prefs as any)?.[prefField] === false) {
      return new Response("Preference disabled", { status: 200 });
    }

    // Get actor username for the message
    let actorUsername: string | undefined;
    if (actor_id) {
      const { data: actor } = await supabaseAdmin
        .from("users")
        .select("username")
        .eq("id", actor_id)
        .single();
      actorUsername = actor?.username;
    }

    const { title, body } = buildMessage(type as NotificationType, actorUsername);

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data: { notificationId: id, type, referenceId: reference_id, referenceType: reference_type },
        sound: "default",
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
