import { View, Text } from "react-native";
import { Avatar } from "~/components/ui/Avatar";
import { StarRating } from "~/components/ui/StarRating";
import { fixed, rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";
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
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 2 }}>
      <Text className="font-body text-xs" style={{ color: raw.t3, width: 8, textAlign: "right" }}>{star}</Text>
      <View style={{ flex: 1, height: 4, backgroundColor: raw.sh, borderRadius: 100, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%`, backgroundColor: fixed.star, borderRadius: 100 }} />
      </View>
      <Text className="font-body text-xs" style={{ color: raw.t3, width: 26, textAlign: "left" }}>{pct}%</Text>
    </View>
  );
}

export function BookCommunityTab() {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  return (
    <View style={{ paddingBottom: 24 }}>
      {/* Stats grid */}
      <View style={{ margin: 18, marginBottom: 14, backgroundColor: raw.surface, borderRadius: 14, borderWidth: 1, borderColor: raw.border, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {STATS.map(({ value, label, isRating }, i) => (
            <View
              key={label}
              style={{
                width: "50%",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 10,
                borderRightWidth:  i % 2 === 0 ? 1 : 0,
                borderBottomWidth: i < 2       ? 1 : 0,
                borderColor: raw.border,
              }}
            >
              <Text className="font-body-bold text-md" style={{ color: isRating ? fixed.star : raw.text }}>
                {value}
              </Text>
              <Text className="font-body text-xs" style={{ color: raw.t3, marginTop: 3 }}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Friends activity */}
      <View style={{ marginHorizontal: 18, marginBottom: 14, backgroundColor: raw.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: raw.border }}>
        <Text className="font-body-sb text-xs" style={{ textTransform: "uppercase", letterSpacing: 1.4, color: raw.t3, marginBottom: 12 }}>
          Actividad de amigos
        </Text>
        {FRIENDS.map(({ user, status, progress, detail }) => {
          const sc = STATUS_COLOR[status];
          return (
            <View key={user.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Avatar user={user} size={30} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="font-body-md text-xs" style={{ color: raw.text }}>{user.name}</Text>
                <Text className="font-body text-xs" style={{ color: raw.t3, marginTop: 1 }}>{detail}</Text>
                {status === "reading" && progress != null && (
                  <View style={{ marginTop: 5, height: 3, backgroundColor: raw.sh, borderRadius: 100, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${progress * 100}%`, backgroundColor: fixed.status.reading, borderRadius: 100 }} />
                  </View>
                )}
              </View>
              <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100, backgroundColor: alpha(sc, 0.11) }}>
                <Text className="font-body-md text-xs" style={{ color: sc }}>
                  {STATUS_LABEL[status]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Rating distribution */}
      <View style={{ marginHorizontal: 18, backgroundColor: raw.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: raw.border }}>
        <Text className="font-body-sb text-xs" style={{ textTransform: "uppercase", letterSpacing: 1.4, color: raw.t3, marginBottom: 12 }}>
          Distribución de ratings
        </Text>
        <View style={{ flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
          <View style={{ alignItems: "center", flexShrink: 0 }}>
            <Text className="font-display-bold text-3xl" style={{ color: fixed.star, lineHeight: 46 }}>4.5</Text>
            <View style={{ marginTop: 4 }}><StarRating rating={4.5} size={12} /></View>
            <Text className="font-body text-xs" style={{ color: raw.t3, marginTop: 4 }}>1,234</Text>
          </View>
          <View style={{ flex: 1, paddingTop: 4 }}>
            {DIST.map(({ star, pct }) => <RatingBar key={star} star={star} pct={pct} />)}
          </View>
        </View>
      </View>
    </View>
  );
}
