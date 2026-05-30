import { ChevronDown } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { fixed, rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";
import { type BookStatus, STATUS_META } from "~/lib/book-status";
import type { Tables } from "~/types/database";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const;
};

interface BookCtaBarProps {
  book: Tables<"books">;
  status: BookStatus | null;
  rating: number | null;
  userBook: Tables<"user_books"> | null | undefined;
  isPending: boolean;
  onStatusPress: () => void;
  onRatingPress: () => void;
}

export function BookCtaBar({
  book,
  status,
  rating,
  userBook,
  isPending,
  onStatusPress,
  onRatingPress,
}: BookCtaBarProps) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  const isReading = status === "reading";
  const statusMeta = status ? STATUS_META[status] : null;
  const statusColor = statusMeta?.color ?? fixed.accent;

  const currentPage = userBook?.current_page ?? null;
  const pageCount = book.page_count ?? null;
  const progressPct =
    isReading && currentPage && pageCount
      ? Math.min(1, currentPage / pageCount)
      : null;

  return (
    <View
      style={{
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: progressPct != null ? 12 : 12,
        borderBottomWidth: 1,
        borderBottomColor: alpha(raw.border, 0.55),
        backgroundColor: raw.bg,
      }}
    >
      {/* Buttons row */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* Main status button */}
        <Pressable
          onPress={onStatusPress}
          disabled={isPending}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: status
              ? alpha(statusColor, 0.13)
              : fixed.accent,
            borderWidth: 1.5,
            borderColor: status ? statusColor : "transparent",
          }}
        >
          <Text
            className="font-body-sb text-sm"
            style={{
              color: status ? statusColor : "#fff",
            }}
          >
            {status ? STATUS_META[status].label : "+ Quiero leer"}
          </Text>
          {status && (
            <ChevronDown
              size={12}
              color={statusColor}
              strokeWidth={2}
            />
          )}
        </Pressable>

        {/* Rating button */}
        <Pressable
          onPress={onRatingPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: raw.surface,
            borderWidth: 1,
            borderColor: raw.border,
          }}
        >
          {rating != null ? (
            <>
              <Text
                className="text-sm"
                style={{
                  color: fixed.star,
                  lineHeight: 15,
                }}
              >
                ★
              </Text>
              <Text
                className="font-body-sb text-sm"
                style={{
                  color: raw.text,
                }}
              >
                {rating}
              </Text>
            </>
          ) : (
            <>
              <Text
                className="text-sm"
                style={{ color: raw.t3, lineHeight: 15 }}
              >
                ☆
              </Text>
              <Text
                className="font-body text-xs"
                style={{
                  color: raw.t2,
                }}
              >
                Calificar
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Reading progress bar */}
      {progressPct != null && (
        <View style={{ marginTop: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <Text
              className="font-body text-xs"
              style={{
                color: raw.t3,
              }}
            >
              Pág. {currentPage} de {pageCount}
            </Text>
            <Text
              className="font-body-sb text-xs"
              style={{
                color: fixed.status.reading,
              }}
            >
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
          <View
            style={{
              height: 3,
              backgroundColor: raw.sh,
              borderRadius: 100,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progressPct * 100}%`,
                backgroundColor: fixed.status.reading,
                borderRadius: 100,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
