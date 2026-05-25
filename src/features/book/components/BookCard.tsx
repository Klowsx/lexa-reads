import { BookCover } from "@/src/components/ui/BookCover";
import { Tables } from "@/src/types";
import { Pressable, Text, View } from "react-native";
import { StarRating } from "~/components/ui/StarRating";

export function BookCard({
  book,
  onPress,
}: {
  book: Tables<"books">;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 p-3 bg-surface rounded-md border border-border mb-2.5"
    >
      <BookCover book={book} width={44} height={66} />
      <View className="flex-1 min-w-0">
        <Text
          className="font-display-sb text-sm text-text leading-tight mb-0.5"
          numberOfLines={2}
        >
          {book.title}
        </Text>
        <Text className="font-body text-sm text-t2 mb-1.5">
          {book.authors?.join(", ")}
        </Text>
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <StarRating rating={1111} size={10} />
          <Text className="text-xs text-t3 font-body">
            {0} · {book.page_count}p
          </Text>
        </View>
        <View className="flex-row gap-1 flex-wrap">
          {book.genres?.slice(0, 2).map((g) => (
            <Text
              key={g}
              className="text-xs font-body text-t3 px-1.5 py-0.5 bg-sh rounded-sm"
            >
              {g}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}
