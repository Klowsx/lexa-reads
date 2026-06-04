import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { STATUS_META, type BookStatus } from '~/lib/book-status';
import { fixed, useColors } from '~/theme/colors';
import { Tables } from '@/src/types';

const STAR = fixed.star;

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

interface BookDetailSheetProps {
  book: Tables<"books">;
  initialUserBook?: { status?: BookStatus | null; rating?: number | null } | null;
  onClose: () => void;
}

export function BookDetailSheet({ book, initialUserBook, onClose }: BookDetailSheetProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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
          className="absolute inset-0 bg-black/[0.72]"
          onPress={onClose}
        />

        <View
          className="rounded-t-lg overflow-hidden bg-surface"
          style={{ maxHeight: '87%', paddingBottom: insets.bottom + 8 }}
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
                  <Text className="font-body-sb text-xs text-star">
                    {111}
                  </Text>
                </View>
                <Text className="font-body text-xs text-t3">
                  {t('book.pagesLong', { count: book.page_count })} · {book.published_year}
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
                    className="rounded-full"
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      backgroundColor: active ? alpha(meta.color, 0.15) : c.sh,
                      borderWidth: 1.5,
                      borderColor: active ? meta.color : c.border,
                    }}
                  >
                    <Text
                      className={active ? 'font-body-md text-xs' : 'font-body text-xs'}
                      style={{ color: active ? meta.color : c.t2 }}
                    >
                      {t(meta.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Rating */}
            <View className="mx-4 mb-3.5 rounded-md p-3 bg-sr border border-border">
              <Text className="font-body-sb text-xs text-t3 tracking-wider uppercase mb-2">
                {t('book.myRatingShort')}
              </Text>
              <View className="flex-row items-center gap-2.5">
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setRating(prev => (prev === i ? null : i))}
                      hitSlop={4}
                    >
                      <View className="relative w-[34px] h-8">
                        <Text
                          className="text-xl absolute"
                          style={{ lineHeight: 32, color: alpha(STAR, 0.2) }}
                        >
                          ★
                        </Text>
                        {rating != null && rating >= i && (
                          <Text
                            className="text-xl absolute leading-8 text-star"
                          >
                            ★
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                {rating != null && (
                  <Text className="font-body-sb text-md text-star">
                    {rating}
                  </Text>
                )}
              </View>
              <Text className="text-xs text-t3 font-body mt-1.5">
                {t('book.doubleTapRemove')}
              </Text>
            </View>

            {/* Synopsis */}
            {book.description ? (
              <View className="px-5 pb-3.5">
                <Text className="font-body-sb text-xs text-t3 tracking-wider uppercase mb-1.5">
                  {t('book.synopsis')}
                </Text>
                <Text className="font-body text-sm text-t2 leading-relaxed">{book.description}</Text>
              </View>
            ) : null}

            {/* Genres */}
            <View className="flex-row flex-wrap gap-1.5 px-5 pb-4">
              {book.genres?.map(g => (
                <Text
                  key={g}
                  className="text-xs font-body text-t3 px-2.5 py-1 rounded-sm bg-sh border border-border"
                >
                  {g}
                </Text>
              ))}
            </View>

            {/* CTA */}
            <View className="px-5 pb-2">
              <TouchableOpacity
                className="rounded-md items-center py-3.5 bg-accent"
                activeOpacity={0.85}
              >
                <Text className="text-sm font-body-sb text-white">
                  {t('book.writeReview')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
