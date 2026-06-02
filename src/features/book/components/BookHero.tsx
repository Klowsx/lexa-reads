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
  onShare?: () => void;
}

export function BookHero({ book, onBack, onShare }: BookHeroProps) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  const coverH = 170;
  const coverW = Math.round(coverH * 0.667);

  return (
    <View className="relative pb-container">
      {/* Full-bleed gradient */}
      <LinearGradient
        colors={[ACCENT, alpha(ACCENT, 0.65), alpha(ACCENT, 0.14), raw.bg]}
        locations={[0, 0.5, 0.82, 1]}
        className="absolute inset-0"
      />

      {/* Watermark title */}
      <View
        className="absolute inset-0 items-center justify-center overflow-hidden"
        pointerEvents="none"
      >
        <Text
          className="font-display-bold text-3xl"
          style={{
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
      <View className="flex-row justify-between items-center px-container pt-[14px] z-[4]">
        <Pressable
          onPress={onBack}
          hitSlop={10}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
        >
          <ChevronLeft size={18} color="#fff" strokeWidth={1.9} />
        </Pressable>

        <View className="flex-row gap-2">
          <Pressable
            hitSlop={10}
            onPress={onShare}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
          >
            <Share2 size={15} color="#fff" strokeWidth={1.5} />
          </Pressable>
          <Pressable
            hitSlop={10}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
          >
            <MoreHorizontal size={15} color="#fff" strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Cover centered */}
      <View
        className="items-center mt-5 z-[4]"
        style={{
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
      <View className="items-center px-9 pt-container z-[4]">
        <Text
          className="font-display-sb text-md text-text text-center mb-1.5 leading-[26px] tracking-[-0.33px]"
          numberOfLines={3}
        >
          {book.title}
        </Text>
        {book.authors && book.authors.length > 0 && (
          <Text className="font-body text-sm text-t2 mb-[3px]">
            {book.authors.join(", ")}
          </Text>
        )}
      </View>

      {/* Stats row */}
      {(book.page_count || book.published_year) && (
        <View className="flex-row justify-center mt-4 z-[4]">
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
              className="items-center px-container"
              style={{
                borderRightWidth: i < arr.length - 1 ? 1 : 0,
                borderRightColor: alpha(raw.border, 0.28),
              }}
            >
              <Text
                className="font-body-bold text-sm text-text leading-[15px]"
              >
                {value}
              </Text>
              <Text className="font-body text-xs text-t3 mt-1 tracking-wide uppercase">
                {label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
