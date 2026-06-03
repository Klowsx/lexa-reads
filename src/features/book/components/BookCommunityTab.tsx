import { ActivityIndicator, View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "~/components/ui/Avatar";
import { StarRating } from "~/components/ui/StarRating";
import { bookCommunityStatsQueryOptions, type FriendActivity } from "../book.queries";
import { useAuthStore } from "~/stores/auth.store";
import { STATUS_META } from "~/lib/book-status";
import { fixed, useColors } from "~/theme/colors";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const;
};

function RatingBar({ star, pct }: { star: number; pct: number }) {
  const c = useColors();

  return (
    <View className="flex-row items-center gap-[7px] py-[2px]">
      <Text className="font-body text-xs text-t3 w-2 text-right">{star}</Text>
      <View className="flex-1 h-1 bg-sh rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: fixed.star }}
        />
      </View>
      <Text className="font-body text-xs text-t3 w-[26px] text-left">{pct}%</Text>
    </View>
  );
}

function FriendRow({ friend, pageCount }: { friend: FriendActivity; pageCount?: number | null }) {
  const c = useColors();
  const meta = STATUS_META[friend.status as keyof typeof STATUS_META];
  if (!meta) return null;

  const progressPct =
    friend.status === "reading" &&
    friend.currentPage != null &&
    pageCount != null &&
    pageCount > 0
      ? Math.min(100, Math.round((friend.currentPage / pageCount) * 100))
      : null;

  return (
    <View className="flex-row items-center gap-2.5 mb-3">
      <Avatar
        displayName={friend.displayName ?? friend.username}
        username={friend.username}
        avatarUrl={friend.avatarUrl}
        size={30}
      />
      <View className="flex-1 min-w-0">
        <Text className="font-body-md text-xs text-text">
          {friend.displayName ?? friend.username}
        </Text>
        <Text className="font-body text-xs text-t3 mt-[1px]">@{friend.username}</Text>
        {progressPct != null && (
          <View className="mt-[5px]">
            <View className="h-[3px] bg-sh rounded-full overflow-hidden">
              <View className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: fixed.status.reading }} />
            </View>
            <Text className="font-body text-[9px] text-t3 mt-[2px]">
              Pág. {friend.currentPage} · {progressPct}%
            </Text>
          </View>
        )}
      </View>
      <View
        className="rounded-full"
        style={{
          paddingHorizontal: 9,
          paddingVertical: 3,
          backgroundColor: alpha(meta.color, 0.11),
        }}
      >
        <Text className="font-body-md text-xs" style={{ color: meta.color }}>
          {meta.label}
        </Text>
      </View>
    </View>
  );
}

export function BookCommunityTab({ bookId, pageCount }: { bookId: string; pageCount?: number | null }) {
  const c = useColors();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const { data, isLoading } = useQuery(bookCommunityStatsQueryOptions(bookId, userId));

  if (isLoading || !data) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  const stats = [
    { value: data.totalReaders.toLocaleString(), label: "Lectores" },
    { value: data.readingCount.toLocaleString(), label: "Leyendo" },
    { value: data.wantCount.toLocaleString(), label: "Por leer" },
    {
      value: data.avgRating > 0 ? `${data.avgRating} ★` : "—",
      label: "Rating",
      isRating: true,
    },
  ];

  return (
    <View className="pb-6">
      {/* Stats grid */}
      <View className="m-container mb-3.5 bg-surface rounded-card border border-border overflow-hidden">
        <View className="flex-row flex-wrap">
          {stats.map(({ value, label, isRating }, i) => (
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
      {data.friendActivity.length > 0 && (
        <View className="mx-container mb-3.5 bg-surface rounded-card p-4 border border-border">
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-3">
            Actividad de amigos
          </Text>
          {data.friendActivity.map((friend) => (
            <FriendRow key={friend.userId} friend={friend} pageCount={pageCount} />
          ))}
        </View>
      )}

      {/* Rating distribution */}
      {data.ratingsCount > 0 && (
        <View className="mx-container bg-surface rounded-card p-4 border border-border">
          <Text className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-3">
            Distribución de ratings
          </Text>
          <View className="flex-row gap-container items-start">
            <View className="items-center shrink-0">
              <Text className="font-display-bold text-3xl text-star leading-[46px]">
                {data.avgRating}
              </Text>
              <View className="mt-1">
                <StarRating rating={data.avgRating} size={12} />
              </View>
              <Text className="font-body text-xs text-t3 mt-1">{data.ratingsCount.toLocaleString()}</Text>
            </View>
            <View className="flex-1 pt-1">
              {data.distribution.map(({ star, pct }) => (
                <RatingBar key={star} star={star} pct={pct} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Empty state */}
      {data.totalReaders === 0 && (
        <View className="mx-container bg-surface rounded-card p-8 border border-border items-center">
          <Text className="font-body text-xs text-t3 text-center">
            Sé el primero en agregar este libro a tu biblioteca.
          </Text>
        </View>
      )}
    </View>
  );
}
