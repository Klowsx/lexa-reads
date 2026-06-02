import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { fixed } from "~/theme/colors";
import type { ReviewWithUser } from "~/features/book/book.queries";

const W = 320;
const BG = "#1C1208";
const MAX_REVIEW_CHARS = 280;

interface ReviewShareCardProps {
  review: ReviewWithUser;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
  bookGoogleId?: string | null;
}

export function ReviewShareCard({
  review,
  bookTitle,
  bookCoverUrl,
  bookGoogleId,
}: ReviewShareCardProps) {
  const user = review.users ?? { username: "usuario", display_name: null, avatar_url: null };
  const displayName = user.display_name ?? user.username;
  const rating = (review as any).rating as number | null | undefined;
  const body =
    review.body.length > MAX_REVIEW_CHARS
      ? review.body.slice(0, MAX_REVIEW_CHARS - 1) + "…"
      : review.body;

  // Initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={s.card}>
      {/* Accent stripe */}
      <View style={s.stripe} />

      {/* Reviewer header */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.headerMeta}>
          <Text style={s.displayName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={s.username}>@{user.username}</Text>
        </View>
        {bookCoverUrl ? (
          <Image source={{ uri: bookCoverUrl }} style={s.miniCover} contentFit="cover" />
        ) : null}
      </View>

      {/* Book + rating */}
      {bookTitle ? (
        <Text style={s.bookTitle} numberOfLines={1}>
          "{bookTitle}"
        </Text>
      ) : null}

      {rating != null ? (
        <View style={s.ratingRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Text key={i} style={[s.star, { color: rating >= i ? fixed.star : "#444" }]}>
              ★
            </Text>
          ))}
        </View>
      ) : null}

      {/* Divider */}
      <View style={s.divider} />

      {/* Review body */}
      <Text style={s.body}>{body}</Text>

      {/* Branding */}
      <View style={s.footer}>
        <Text style={s.brand}>lexa</Text>
        <Text style={s.url}>
          {bookGoogleId
            ? `lexareads.app/book/${bookGoogleId}`
            : "lexareads.app"}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: W,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 44,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: fixed.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: fixed.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    color: "#F0EAE2",
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
  },
  username: {
    color: "rgba(240,234,226,0.4)",
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  miniCover: {
    width: 36,
    height: 54,
    borderRadius: 3,
    flexShrink: 0,
  },
  bookTitle: {
    color: "rgba(240,234,226,0.6)",
    fontSize: 12,
    fontFamily: "PlayfairDisplay_400Regular_Italic",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  star: {
    fontSize: 13,
    marginRight: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(240,234,226,0.08)",
    marginBottom: 14,
  },
  body: {
    color: "rgba(240,234,226,0.78)",
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    lineHeight: 21,
    marginBottom: 20,
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  brand: {
    color: fixed.accent,
    fontSize: 13,
    fontFamily: "PlayfairDisplay_400Regular_Italic",
  },
  url: {
    color: "rgba(240,234,226,0.25)",
    fontSize: 9,
    fontFamily: "DMSans_400Regular",
  },
});
