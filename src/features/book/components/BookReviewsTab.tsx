import { useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";
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

const REVIEWS = [
  { id: "r1", user: USERS[0], rating: 5,   text: "Una de las mejores obras de fantasía épica que he leído. La prosa es extraordinaria — cada página tiene una densidad poética que te obliga a leer despacio para saborear cada frase.", likes: 47, time: "2d",   liked: false },
  { id: "r2", user: USERS[2], rating: 4,   text: "Mundo increíblemente construido. Algunos capítulos en el medio ralentizan bastante el ritmo, pero compensa con creces al final. El sistema de magia basado en simpatía es uno de los más originales del género.", likes: 31, time: "5d",   liked: true  },
  { id: "r3", user: USERS[1], rating: 5,   text: "Comencé sin grandes expectativas y terminé completamente atrapado. El Alar y la simpatía como sistema mágico son los más originales que recuerdo haber encontrado.", likes: 28, time: "1sem", liked: false },
  { id: "r4", user: USERS[3], rating: 3,   text: "Buena escritura, pero me cuesta conectar con el protagonista. Demasiado \"elegido\" para mi gusto. El mundo sí está muy bien construido y las escenas en la Universidad son lo mejor.", likes: 12, time: "2sem", liked: false },
];

function RatingBar({ star, pct, active, onPress }: { star: number; pct: number; active: boolean; onPress: () => void }) {
  const c = useColors();

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-[7px] py-[2px]">
      <Text
        className={active ? "font-body-bold text-xs" : "font-body text-xs"}
        style={{ color: active ? fixed.star : c.t3, width: 8, textAlign: "right" }}
      >
        {star}
      </Text>
      <View className="flex-1 h-1 bg-sh rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: active ? c.text : fixed.star }}
        />
      </View>
      <Text
        className="font-body text-xs"
        style={{ color: active ? c.text : c.t3, width: 26, textAlign: "left" }}
      >
        {pct}%
      </Text>
    </Pressable>
  );
}

function ReviewCard({ review }: { review: typeof REVIEWS[number] }) {
  const c = useColors();
  const [liked, setLiked] = useState(review.liked);
  const [likes, setLikes] = useState(review.likes);

  return (
    <View className="bg-surface rounded-card p-4 border border-border mb-2.5">
      {/* Header */}
      <View className="flex-row items-start gap-2.5 mb-2.5">
        <Avatar user={review.user} size={30} />
        <View className="flex-1">
          <Text className="font-body-sb text-xs text-text">{review.user.name}</Text>
          <StarRating rating={review.rating} size={11} />
        </View>
        <Text className="font-body text-xs text-t3">hace {review.time}</Text>
      </View>

      {/* Body */}
      <Text
        className="font-body text-xs text-t2 mb-3"
        style={{ lineHeight: 13 * 1.7 }}
      >
        {review.text}
      </Text>

      {/* Footer */}
      <View
        className="flex-row gap-4 pt-2.5 border-t"
        style={{ borderTopColor: alpha(c.border, 0.5) }}
      >
        <TouchableOpacity
          onPress={() => { setLiked((l) => !l); setLikes((n) => liked ? n - 1 : n + 1); }}
          className="flex-row items-center gap-[5px]"
        >
          <Heart size={14} color={liked ? fixed.accent : c.t3} fill={liked ? fixed.accent : "transparent"} strokeWidth={1.8} />
          <Text className="font-body text-xs" style={{ color: liked ? fixed.accent : c.t3 }}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-[5px]">
          <MessageCircle size={14} color={c.t3} strokeWidth={1.8} />
          <Text className="font-body text-xs text-t3">Responder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BookReviewsTab({ onWriteReview }: { onWriteReview?: () => void }) {
  const c = useColors();
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const displayed = starFilter ? REVIEWS.filter((r) => r.rating === starFilter) : REVIEWS;

  return (
    <View className="pb-6">
      {/* Rating summary */}
      <View className="m-container mb-0 bg-surface rounded-card p-4 border border-border flex-row gap-container items-start">
        <View className="items-center shrink-0">
          <Text className="font-display-bold text-3xl" style={{ color: fixed.star, lineHeight: 48 }}>4.5</Text>
          <View className="mt-[5px]"><StarRating rating={4.5} size={12} /></View>
          <Text className="font-body text-xs text-t3 mt-[5px] text-center" style={{ lineHeight: 14 }}>
            {"1,234\nreseñas"}
          </Text>
        </View>
        <View className="flex-1 pt-1">
          {DIST.map(({ star, pct }) => (
            <RatingBar
              key={star}
              star={star}
              pct={pct}
              active={starFilter === star}
              onPress={() => setStarFilter(starFilter === star ? null : star)}
            />
          ))}
        </View>
      </View>

      {/* Star filter pills */}
      <View className="flex-row flex-wrap gap-1.5 px-container pt-3.5">
        {[null, 5, 4, 3, 2, 1].map((r) => (
          <Pressable
            key={r ?? "all"}
            onPress={() => setStarFilter(r)}
            className="rounded-full border"
            style={{
              paddingHorizontal: 11,
              paddingVertical: 4,
              backgroundColor: starFilter === r ? fixed.accent : c.surface,
              borderColor: starFilter === r ? fixed.accent : c.border,
            }}
          >
            <Text className="font-body text-xs" style={{ color: starFilter === r ? "#fff" : c.t3 }}>
              {r === null ? "Todas" : `${r} ★`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Write review CTA */}
      <View className="px-container pt-3.5 pb-3.5">
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          className="py-3.5 rounded-card bg-accent items-center"
        >
          <Text className="font-body-sb text-sm text-white">Escribir mi reseña</Text>
        </TouchableOpacity>
      </View>

      {/* Review cards */}
      <View className="px-container">
        {displayed.length === 0 ? (
          <View className="items-center py-6">
            <Text className="font-body text-xs text-t3">Sin reseñas para este rating</Text>
          </View>
        ) : (
          displayed.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </View>
    </View>
  );
}
