import { Tables } from "@/src/types";
import { Text, View } from "react-native";
import { Image } from "expo-image";

interface BookCoverProps {
  book: Tables<"books">;
  width?: number;
  height?: number;
}

function colorFromId(id: string): string {
  if (!id) return "#3D2B1F";
  const palette = [
    "#3D2B1F",
    "#1F3D2B",
    "#1F2B3D",
    "#3D1F2B",
    "#2B3D1F",
    "#2B1F3D",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function BookCover({ book, width = 60, height = 90 }: BookCoverProps) {
  const bg = colorFromId(book.google_books_id ?? "");
  const fontSize = Math.max(6, Math.min(9, height * 0.078));
  const rawTitle = book.title ?? "";
  const title = rawTitle.length > 22 ? rawTitle.slice(0, 20) + "…" : rawTitle;

  if (book.cover_url) {
    return (
      <Image
        source={{ uri: book.cover_url }}
        style={{ width, height, borderRadius: 5 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 5,
        backgroundColor: bg,
        overflow: "hidden",
      }}
    >
      <View className="flex-1 justify-end p-1">
        <Text
          style={{
            fontSize,
            color: "rgba(240,234,226,0.82)",
            fontFamily: "PlayfairDisplay_400Regular",
            lineHeight: fontSize * 1.25,
          }}
          numberOfLines={3}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
