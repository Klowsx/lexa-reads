import { useState } from "react";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";
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

const REVIEWS = [
  { id: "r1", user: USERS[0], rating: 5,   text: "Una de las mejores obras de fantasía épica que he leído. La prosa es extraordinaria — cada página tiene una densidad poética que te obliga a leer despacio para saborear cada frase.", likes: 47, time: "2d",   liked: false },
  { id: "r2", user: USERS[2], rating: 4,   text: "Mundo increíblemente construido. Algunos capítulos en el medio ralentizan bastante el ritmo, pero compensa con creces al final. El sistema de magia basado en simpatía es uno de los más originales del género.", likes: 31, time: "5d",   liked: true  },
  { id: "r3", user: USERS[1], rating: 5,   text: "Comencé sin grandes expectativas y terminé completamente atrapado. El Alar y la simpatía como sistema mágico son los más originales que recuerdo haber encontrado.", likes: 28, time: "1sem", liked: false },
  { id: "r4", user: USERS[3], rating: 3,   text: "Buena escritura, pero me cuesta conectar con el protagonista. Demasiado \"elegido\" para mi gusto. El mundo sí está muy bien construido y las escenas en la Universidad son lo mejor.", likes: 12, time: "2sem", liked: false },
];

function RatingBar({ star, pct, active, onPress }: { star: number; pct: number; active: boolean; onPress: () => void }) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 2 }}>
      <Text className={active ? "font-body-bold text-xs" : "font-body text-xs"} style={{ color: active ? fixed.star : raw.t3, width: 8, textAlign: "right" }}>
        {star}
      </Text>
      <View style={{ flex: 1, height: 4, backgroundColor: raw.sh, borderRadius: 100, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%`, backgroundColor: active ? raw.text : fixed.star, borderRadius: 100 }} />
      </View>
      <Text className="font-body text-xs" style={{ color: active ? raw.text : raw.t3, width: 26, textAlign: "left" }}>
        {pct}%
      </Text>
    </Pressable>
  );
}

function ReviewCard({ review }: { review: typeof REVIEWS[number] }) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;
  const [liked, setLiked] = useState(review.liked);
  const [likes, setLikes] = useState(review.likes);

  return (
    <View style={{ backgroundColor: raw.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: raw.border, marginBottom: 10 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <Avatar user={review.user} size={30} />
        <View style={{ flex: 1 }}>
          <Text className="font-body-sb text-xs" style={{ color: raw.text }}>{review.user.name}</Text>
          <StarRating rating={review.rating} size={11} />
        </View>
        <Text className="font-body text-xs" style={{ color: raw.t3 }}>hace {review.time}</Text>
      </View>

      {/* Body */}
      <Text className="font-body text-xs" style={{ color: raw.t2, lineHeight: 13 * 1.7, marginBottom: 12 }}>
        {review.text}
      </Text>

      {/* Footer */}
      <View style={{ flexDirection: "row", gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: alpha(raw.border, 0.5) }}>
        <TouchableOpacity
          onPress={() => { setLiked((l) => !l); setLikes((n) => liked ? n - 1 : n + 1); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
        >
          <Heart size={14} color={liked ? fixed.accent : raw.t3} fill={liked ? fixed.accent : "transparent"} strokeWidth={1.8} />
          <Text className="font-body text-xs" style={{ color: liked ? fixed.accent : raw.t3 }}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <MessageCircle size={14} color={raw.t3} strokeWidth={1.8} />
          <Text className="font-body text-xs" style={{ color: raw.t3 }}>Responder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BookReviewsTab({ onWriteReview }: { onWriteReview?: () => void }) {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const displayed = starFilter ? REVIEWS.filter((r) => r.rating === starFilter) : REVIEWS;

  return (
    <View style={{ paddingBottom: 24 }}>
      {/* Rating summary */}
      <View style={{ margin: 18, marginBottom: 0, backgroundColor: raw.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: raw.border, flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
        <View style={{ alignItems: "center", flexShrink: 0 }}>
          <Text className="font-display-bold text-3xl" style={{ color: fixed.star, lineHeight: 48 }}>4.5</Text>
          <View style={{ marginTop: 5 }}><StarRating rating={4.5} size={12} /></View>
          <Text className="font-body text-xs" style={{ color: raw.t3, marginTop: 5, textAlign: "center", lineHeight: 14 }}>
            {"1,234\nreseñas"}
          </Text>
        </View>
        <View style={{ flex: 1, paddingTop: 4 }}>
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 18, paddingTop: 14 }}>
        {[null, 5, 4, 3, 2, 1].map((r) => (
          <Pressable
            key={r ?? "all"}
            onPress={() => setStarFilter(r)}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 4,
              borderRadius: 100,
              backgroundColor: starFilter === r ? fixed.accent : raw.surface,
              borderWidth: 1,
              borderColor: starFilter === r ? fixed.accent : raw.border,
            }}
          >
            <Text className="font-body text-xs" style={{ color: starFilter === r ? "#fff" : raw.t3 }}>
              {r === null ? "Todas" : `${r} ★`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Write review CTA */}
      <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 }}>
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: fixed.accent, alignItems: "center" }}
        >
          <Text className="font-body-sb text-sm" style={{ color: "#fff" }}>Escribir mi reseña</Text>
        </TouchableOpacity>
      </View>

      {/* Review cards */}
      <View style={{ paddingHorizontal: 18 }}>
        {displayed.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text className="font-body text-xs" style={{ color: raw.t3 }}>Sin reseñas para este rating</Text>
          </View>
        ) : (
          displayed.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </View>
    </View>
  );
}
