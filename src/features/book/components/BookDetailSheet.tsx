import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import type { BookStatus, MockBook, MockUserBook } from '~/mock';
import { STATUS_META } from '~/mock';
import { fixed, rawDark, rawLight } from '~/theme/colors';
import { useColors } from '~/theme/colors';
import { Tables } from '@/src/types';

const STAR = fixed.star;

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface BookDetailSheetProps {
  book: Tables<"books">;
  initialUserBook?: MockUserBook | null;
  onClose: () => void;
}

export function BookDetailSheet({ book, initialUserBook, onClose }: BookDetailSheetProps) {
  const scheme = useColorScheme();
  const raw = scheme === 'dark' ? rawDark : rawLight;
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<BookStatus | null>(initialUserBook?.status ?? null);
  const [rating, setRating] = useState<number | null>(initialUserBook?.rating ?? null);

  const STATUS_ORDER: BookStatus[] = ['want_to_read', 'reading', 'read', 'abandoned'];

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          onPress={onClose}
        />

        <View
          className="rounded-t-lg overflow-hidden"
          style={{ backgroundColor: raw.surface, maxHeight: '87%', paddingBottom: insets.bottom + 8 }}
        >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header: cover + info */}
            <View className="flex-row gap-4 px-5 pt-4 pb-3.5">
              <BookCover book={book} width={82} height={124} />
              <View className="flex-1">
                <Text className="font-display-sb text-md text-text leading-tight mb-1" numberOfLines={3}>
                  {book.title}
                </Text>
                <Text className="font-body text-sm text-t2 mb-2">{book.authors?.join(', ')}</Text>
                <View className="flex-row items-center gap-1.5 mb-1.5">
                  <StarRating rating={111} size={13} />
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: STAR }}>
                    {111}
                  </Text>
                </View>
                <Text className="font-body text-xs text-t3">
                  {book.page_count} páginas · {book.published_year}
                </Text>
              </View>
            </View>

            {/* Status buttons */}
            <View className="flex-row flex-wrap gap-1.5 px-5 pb-3.5">
              {STATUS_ORDER.map(s => {
                const meta = STATUS_META[s];
                const active = status === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(active ? null : s)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 100,
                      backgroundColor: active ? alpha(meta.color, 0.15) : raw.sh,
                      borderWidth: 1.5,
                      borderColor: active ? meta.color : raw.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
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

            {/* Rating */}
            <View
              className="mx-4 mb-3.5 rounded-md p-3"
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
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setRating(prev => (prev === i ? null : i))}
                      hitSlop={4}
                    >
                      <View style={{ position: 'relative', width: 34, height: 32 }}>
                        <Text
                          style={{
                            position: 'absolute',
                            fontSize: 30,
                            lineHeight: 32,
                            color: alpha(STAR, 0.2),
                          }}
                        >
                          ★
                        </Text>
                        {rating != null && rating >= i && (
                          <Text
                            style={{ position: 'absolute', fontSize: 30, lineHeight: 32, color: STAR }}
                          >
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
              <Text className="text-xs text-t3 font-body mt-1.5">
                Toca dos veces para quitar el rating
              </Text>
            </View>

            {/* Synopsis */}
            {book.description ? (
              <View className="px-5 pb-3.5">
                <Text
                  className="text-xs text-t3 tracking-wider mb-1.5"
                  style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'uppercase' }}
                >
                  Sinopsis
                </Text>
                <Text className="font-body text-sm text-t2 leading-relaxed">{book.description}</Text>
              </View>
            ) : null}

            {/* Genres */}
            <View className="flex-row flex-wrap gap-1.5 px-5 pb-4">
              {book.genres?.map(g => (
                <Text
                  key={g}
                  className="text-xs font-body text-t3 px-2.5 py-1 rounded-sm"
                  style={{ backgroundColor: raw.sh, borderWidth: 1, borderColor: raw.border }}
                >
                  {g}
                </Text>
              ))}
            </View>

            {/* CTA */}
            <View className="px-5 pb-2">
              <TouchableOpacity
                className="rounded-md items-center py-3.5"
                style={{ backgroundColor: c.accent }}
                activeOpacity={0.85}
              >
                <Text className="text-sm font-body-sb" style={{ color: '#fff' }}>
                  Escribir reseña
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
