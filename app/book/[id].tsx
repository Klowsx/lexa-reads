import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '~/components/ui/BookCover';
import { useBook } from '~/features/book/hooks/useBook';
import { type BookStatus, STATUS_META, STATUS_ORDER } from '~/lib/book-status';
import { fixed, rawDark, rawLight } from '~/theme/colors';

const STAR = fixed.star;

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const raw = scheme === 'dark' ? rawDark : rawLight;
  const insets = useSafeAreaInsets();

  const { data: book, isLoading } = useBook(id);

  const [status, setStatus] = useState<BookStatus | null>(null);
  const [rating, setRating] = useState<number | null>(null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={fixed.accent} />
      </View>
    );
  }

  if (!book) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-8">
        <Text className="font-body text-t2 text-center">No se encontró el libro.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-body-sb text-sm" style={{ color: fixed.accent }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const year = book.published_date?.slice(0, 4);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="flex-row items-center gap-1 px-4 py-3"
      >
        <ChevronLeft size={20} color={raw.t3} strokeWidth={1.6} />
        <Text className="font-body text-sm text-t2">Volver</Text>
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Hero */}
        <View className="items-center px-6 pt-2 pb-6">
          <BookCover book={book} width={120} height={180} />
          <Text
            className="font-display-sb text-xl text-text text-center mt-5 leading-tight"
            numberOfLines={4}
          >
            {book.title}
          </Text>
          <Text className="font-body text-base text-t2 text-center mt-1.5">
            {book.authors?.join(', ')}
          </Text>
          {(book.page_count || year) ? (
            <Text className="font-body text-sm text-t3 mt-1">
              {[book.page_count ? `${book.page_count} págs` : null, year].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        {/* Status buttons */}
        <View className="px-5 mb-4">
          <Text
            className="text-xs text-t3 mb-2.5 tracking-widest"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Estado
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const active = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(active ? null : s)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: active ? alpha(meta.color, 0.15) : raw.sh,
                    borderWidth: 1.5,
                    borderColor: active ? meta.color : raw.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: active ? 'DMSans_500Medium' : 'DMSans_400Regular',
                      color: active ? meta.color : raw.t2,
                    }}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Rating */}
        <View
          className="mx-5 mb-4 rounded-md p-3.5"
          style={{ backgroundColor: raw.sr, borderWidth: 1, borderColor: raw.border }}
        >
          <Text
            className="text-xs text-t3 tracking-wider mb-2"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Mi rating
          </Text>
          <View className="flex-row items-center gap-2.5">
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating((prev) => (prev === i ? null : i))}
                  hitSlop={4}
                >
                  <View style={{ position: 'relative', width: 34, height: 32 }}>
                    <Text style={{ position: 'absolute', fontSize: 30, lineHeight: 32, color: alpha(STAR, 0.2) }}>
                      ★
                    </Text>
                    {rating != null && rating >= i && (
                      <Text style={{ position: 'absolute', fontSize: 30, lineHeight: 32, color: STAR }}>
                        ★
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {rating != null && (
              <Text style={{ fontSize: 22, fontFamily: 'DMSans_600SemiBold', color: STAR }}>
                {rating}
              </Text>
            )}
          </View>
        </View>

        {/* CTA: escribir reseña */}
        <View className="px-5 mb-5">
          <TouchableOpacity
            className="rounded-md items-center py-3.5"
            style={{ backgroundColor: fixed.accent }}
            activeOpacity={0.85}
          >
            <Text className="text-sm font-body-sb" style={{ color: '#fff' }}>
              Escribir reseña
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sinopsis */}
        {book.description ? (
          <View className="px-5 mb-5">
            <Text
              className="text-xs text-t3 tracking-wider mb-2"
              style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
            >
              Sinopsis
            </Text>
            <Text className="font-body text-sm text-t2 leading-relaxed">{book.description}</Text>
          </View>
        ) : null}

        {/* Géneros */}
        {book.genres && book.genres.length > 0 ? (
          <View className="px-5 mb-5">
            <Text
              className="text-xs text-t3 tracking-wider mb-2"
              style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
            >
              Géneros
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {book.genres.map((g) => (
                <Text
                  key={g}
                  className="text-xs font-body text-t3 px-2.5 py-1 rounded-sm"
                  style={{ backgroundColor: raw.sh, borderWidth: 1, borderColor: raw.border }}
                >
                  {g}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Detalles */}
        <View className="px-5 mb-5">
          <Text
            className="text-xs text-t3 tracking-wider mb-2"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Detalles
          </Text>
          <View
            className="rounded-md overflow-hidden"
            style={{ borderWidth: 1, borderColor: raw.border }}
          >
            {[
              { label: 'Editorial', value: book.publisher },
              { label: 'Publicado', value: book.published_date },
              { label: 'Idioma', value: book.language?.toUpperCase() },
              { label: 'ISBN-13', value: book.isbn_13 },
            ]
              .filter((row) => row.value)
              .map((row, i, arr) => (
                <View
                  key={row.label}
                  className="flex-row justify-between px-3.5 py-2.5"
                  style={{
                    backgroundColor: i % 2 === 0 ? raw.sr : 'transparent',
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                    borderColor: raw.border,
                  }}
                >
                  <Text className="font-body text-sm text-t3">{row.label}</Text>
                  <Text className="font-body text-sm text-t2">{row.value}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Reseñas — placeholder */}
        <View className="px-5">
          <Text
            className="text-xs text-t3 tracking-wider mb-3"
            style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
          >
            Reseñas
          </Text>
          <View
            className="rounded-md items-center py-8"
            style={{ backgroundColor: raw.sr, borderWidth: 1, borderColor: raw.border }}
          >
            <Text className="font-body text-sm text-t3">Todavía no hay reseñas.</Text>
            <Text className="font-body text-xs text-t3 mt-1">¡Sé el primero en escribir una!</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
