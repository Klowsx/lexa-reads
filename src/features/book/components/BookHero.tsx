import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, MoreHorizontal, Share2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "~/components/ui/BookCover";
import { fixed, rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";
import type { Tables } from "~/types/database";

const ACCENT = fixed.accent;

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const;
};

interface BookHeroProps {
  book: Tables<"books">;
  onBack: () => void;
}

export function BookHero({ book, onBack }: BookHeroProps) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  const coverH = 170;
  const coverW = Math.round(coverH * 0.667);

  return (
    <View style={{ position: "relative", paddingBottom: 18 }}>
      {/* Full-bleed gradient */}
      <LinearGradient
        colors={[ACCENT, alpha(ACCENT, 0.65), alpha(ACCENT, 0.14), raw.bg]}
        locations={[0, 0.5, 0.82, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Watermark title */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 108,
            color: alpha(ACCENT, 0.06),
            lineHeight: 108 * 0.88,
            transform: [{ rotate: "-7deg" }],
            letterSpacing: -2,
            width: "150%",
            textAlign: "center",
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {book.title}
        </Text>
      </View>

      {/* Nav row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingTop: 14,
          zIndex: 4,
        }}
      >
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.42)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={18} color="#fff" strokeWidth={1.9} />
        </Pressable>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.42)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Share2 size={15} color="#fff" strokeWidth={1.5} />
          </Pressable>
          <Pressable
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.42)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={15} color="#fff" strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Cover centered */}
      <View
        style={{
          alignItems: "center",
          marginTop: 20,
          zIndex: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: 0.93,
          shadowRadius: 34,
          elevation: 20,
        }}
      >
        <BookCover book={book} width={coverW} height={coverH} />
      </View>

      {/* Title + author */}
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: 36,
          paddingTop: 18,
          zIndex: 4,
        }}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_600SemiBold",
            fontSize: 22,
            color: raw.text,
            lineHeight: 22 * 1.2,
            letterSpacing: -0.33,
            textAlign: "center",
            marginBottom: 6,
          }}
          numberOfLines={3}
        >
          {book.title}
        </Text>
        {book.authors && book.authors.length > 0 && (
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 14,
              color: raw.t2,
              marginBottom: 3,
            }}
          >
            {book.authors.join(", ")}
          </Text>
        )}
      </View>

      {/* Stats row */}
      {(book.page_count || book.published_year) && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 16,
            zIndex: 4,
          }}
        >
          {(
            [
              book.page_count ? [`${book.page_count}p`, "páginas"] : null,
              book.published_year
                ? [String(book.published_year), "publicado"]
                : null,
            ].filter((x): x is [string, string] => x != null)
          ).map(([value, label], i, arr) => (
              <View
                key={label}
                style={{
                  alignItems: "center",
                  paddingHorizontal: 18,
                  borderRightWidth: i < arr.length - 1 ? 1 : 0,
                  borderRightColor: alpha(raw.border, 0.28),
                }}
              >
                <Text
                  style={{
                    fontFamily: "DMSans_700Bold",
                    fontSize: 15,
                    color: raw.text,
                    lineHeight: 15,
                  }}
                >
                  {value}
                </Text>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 9,
                    color: raw.t3,
                    marginTop: 4,
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}
