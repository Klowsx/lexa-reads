import { useRouter } from "expo-router";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "~/components/ui/Avatar";
import { fixed, useColors } from "~/theme/colors";
import { formatRelativeTime } from "~/lib/utils";
import type { NotificationItem, NotificationType } from "../notifications.queries";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

// El texto vive en i18n (notif.*); aquí solo el icono y el color por tipo.
const TYPE_CONFIG: Record<
  NotificationType,
  { IconComp: typeof Bell; color: string }
> = {
  new_follower:                { IconComp: UserPlus,      color: fixed.accentAlt.blue  },
  review_like:                 { IconComp: Heart,         color: fixed.accent          },
  activity_like:               { IconComp: Heart,         color: fixed.accent          },
  comment_received:            { IconComp: MessageCircle, color: fixed.accentAlt.green },
  reading_challenge_completed: { IconComp: Bell,          color: fixed.star            },
  recommendation_received:     { IconComp: Bell,          color: fixed.accentAlt.rose  },
};

function notificationTarget(
  type: NotificationType,
  referenceId: string | null,
  referenceType: string | null,
  actorUsername?: string,
): string | null {
  if (type === "new_follower" && actorUsername) return `/user/${actorUsername}`;
  if (type === "recommendation_received" && actorUsername) return `/user/${actorUsername}`;
  if (type === "review_like") {
    if (referenceId) return `/comments/${referenceId}?type=review`;
    if (actorUsername) return `/user/${actorUsername}`;
  }
  if ((type === "activity_like" || type === "comment_received") && referenceId) {
    return `/comments/${referenceId}?type=${referenceType ?? "activity"}`;
  }
  return null;
}

interface NotificationRowProps {
  item: NotificationItem;
}

export function NotificationRow({ item }: NotificationRowProps) {
  const c = useColors();
  const router = useRouter();
  const { t } = useTranslation();
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.new_follower;
  const actorName = item.actor?.display_name ?? item.actor?.username ?? t("notif.someone");
  const actorUsername = item.actor?.username;
  const label = t(`notif.${item.type}`, { actor: actorName });
  const isUnread = item.read_at === null;
  const target = notificationTarget(item.type, item.reference_id, item.reference_type, actorUsername);

  function handlePress() {
    if (target) router.push(target as any);
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 gap-3"
      style={{
        backgroundColor: isUnread ? alpha(c.accent, 0.06) : "transparent",
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      {/* Actor avatar or system icon */}
      {item.actor ? (
        <View className="relative">
          <Avatar
            displayName={item.actor.display_name ?? item.actor.username}
            username={item.actor.username}
            avatarUrl={item.actor.avatar_url ?? undefined}
            size={42}
          />
          {/* Type badge */}
          <View
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border border-bg"
            style={{ backgroundColor: config.color }}
          >
            <config.IconComp size={10} color="#fff" strokeWidth={2.2} />
          </View>
        </View>
      ) : (
        <View
          className="w-[42px] h-[42px] rounded-full items-center justify-center"
          style={{ backgroundColor: alpha(config.color, 0.15) }}
        >
          <config.IconComp size={20} color={config.color} strokeWidth={1.8} />
        </View>
      )}

      {/* Text */}
      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="text-sm font-body text-text leading-[20px]" numberOfLines={2}>
          {label}
        </Text>
        <Text className="text-xs font-body text-t3">
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      {/* Unread dot */}
      {isUnread && (
        <View
          className="w-2 h-2 rounded-full shrink-0 bg-accent"
        />
      )}
    </Pressable>
  );
}
