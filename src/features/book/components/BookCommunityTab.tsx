import { View, Text } from "react-native";
import { Avatar } from "~/components/ui/Avatar";
import { StarRating } from "~/components/ui/StarRating";
import { fixed, useColors } from "~/theme/colors";
import { USERS } from "~/mock";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const;
};

const DIST = [
  { star: 5, pct: 62 },
  { star: 4, pct: 22 },
  { star: 3, pct: 10 },
  { star: 2, pct: 4 },
  { star: 1, pct: 2 },
];

const FRIENDS = [
  { user: USERS[0], status: "read"         as const, progress: null, detail: "Terminó hace 2 días" },
  { user: USERS[1], status: "reading"      as const, progress: 0.47, detail: "Desde hace 4 días"   },
  { user: USERS[2], status: "want_to_read" as const, progress: null, detail: "En su lista \"Pendientes\"" },
];

const STATUS_COLOR: Record<string, string> = {
  reading:      fixed.status.reading,
  read:         fixed.status.read,
  want_to_read: fixed.status.want,
  abandoned:    fixed.status.abandoned,
};

const STATUS_LABEL: Record<string, string> = {
  reading:      "Leyendo",
  read:         "Leído",
  want_to_read: "Por leer",
  abandoned:    "Abandonado",
};

const STATS = [
  { value: "1,234", label: "Lectores" },
  { value: "89",    label: "Leyendo"  },
  { value: "432",   label: "Por leer" },
  { value: "4.5 ★", label: "Rating",  isRating: true },
];

function RatingBar({ star, pct }: { star: number; pct: number }) {
  const c = useColors();

  return (
    <View className="flex-row items-center gap-[7px] py-[2px]">
      <Text className="font-body text-xs text-t3" style={{ width: 8, textAlign: "right" }}>{star}</Text>
      <View className="flex-1 h-1 bg-sh rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: fixed.star }}
        />
      </View>
      <Text className="font-body text-xs text-t3" style={{ width: 26, textAlign: "left" }}>{pct}%</Text>
    </View>
  );
}

export function BookCommunityTab() {
  const c = useColors();

  return (
    <View className="pb-6">
      {/* Stats grid */}
      <View className="m-container mb-3.5 bg-surface rounded-card border border-border overflow-hidden">
        <View className="flex-row flex-wrap">
          {STATS.map(({ value, label, isRating }, i) => (
            <View
              key={label}
              className="items-center py-4 px-2.5"
              style={{
                width: "50%",
                borderRightWidth:  i % 2 === 0 ? 1 : 0,
                borderBottomWidth: i < 2       ? 1 : 0,
                borderColor: c.border,
              }}
            >
              <Text className="font-body-bold text-md" style={{ color: isRating ? fixed.star : c.text }}>
                {value}
              </Text>
              <Text className="font-body text-xs text-t3 mt-[3px]">{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Friends activity */}
      <View className="mx-container mb-3.5 bg-surface rounded-card p-4 border border-border">
        <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-3">
          Actividad de amigos
        </Text>
        {FRIENDS.map(({ user, status, progress, detail }) => {
          const sc = STATUS_COLOR[status];
          return (
            <View key={user.id} className="flex-row items-center gap-2.5 mb-3">
              <Avatar user={user} size={30} />
              <View className="flex-1 min-w-0">
                <Text className="font-body-md text-xs text-text">{user.name}</Text>
                <Text className="font-body text-xs text-t3 mt-[1px]">{detail}</Text>
                {status === "reading" && progress != null && (
                  <View className="mt-[5px] h-[3px] bg-sh rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${progress * 100}%`, backgroundColor: fixed.status.reading }}
                    />
                  </View>
                )}
              </View>
              <View
                className="rounded-full"
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  backgroundColor: alpha(sc, 0.11),
                }}
              >
                <Text className="font-body-md text-xs" style={{ color: sc }}>
                  {STATUS_LABEL[status]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Rating distribution */}
      <View className="mx-container bg-surface rounded-card p-4 border border-border">
        <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-3">
          Distribución de ratings
        </Text>
        <View className="flex-row gap-container items-start">
          <View className="items-center shrink-0">
            <Text className="font-display-bold text-3xl" style={{ color: fixed.star, lineHeight: 46 }}>4.5</Text>
            <View className="mt-1"><StarRating rating={4.5} size={12} /></View>
            <Text className="font-body text-xs text-t3 mt-1">1,234</Text>
          </View>
          <View className="flex-1 pt-1">
            {DIST.map(({ star, pct }) => <RatingBar key={star} star={star} pct={pct} />)}
          </View>
        </View>
      </View>
    </View>
  );
}
