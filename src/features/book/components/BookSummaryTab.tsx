import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { fixed, useColors } from "~/theme/colors";
import { type BookStatus, STATUS_META, STATUS_ORDER } from "~/lib/book-status";
import type { Tables } from "~/types/database";

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})` as const;
};

const STAR = fixed.star;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="font-body-sb text-xs text-t3 uppercase tracking-wider mb-2.5"
    >
      {children}
    </Text>
  );
}

interface BookSummaryTabProps {
  book: Tables<"books">;
  status: BookStatus | null;
  rating: number | null;
  isPending: boolean;
  onStatusClick: (s: BookStatus) => void;
  onRatingClick: (i: number) => void;
  onWriteReview: () => void;
}

export function BookSummaryTab({
  book,
  status,
  rating,
  isPending,
  onStatusClick,
  onRatingClick,
  onWriteReview,
}: BookSummaryTabProps) {
  const c = useColors();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [rHover, setRHover] = useState<number | null>(null);

  const detailRows = [
    { label: t("book.detail.publisher"), value: book.publisher },
    { label: t("book.detail.published"), value: book.published_date },
    { label: t("book.detail.language"), value: book.language?.toUpperCase() },
    { label: t("book.detail.pages"), value: book.page_count?.toString() },
    { label: t("book.detail.isbn13"), value: book.isbn_13 },
  ].filter((r) => r.value);

  return (
    <View className="pb-6">
      {/* Status pills */}
      <View
        className="px-container py-4 border-b"
        style={{ borderBottomColor: alpha(c.border, 0.55) }}
      >
        <View className="flex-row flex-wrap gap-1.5">
          {STATUS_ORDER.map((s) => {
            const meta = STATUS_META[s];
            const active = status === s;
            return (
              <Pressable
                key={s}
                onPress={() => onStatusClick(s)}
                disabled={isPending}
                className="rounded-full"
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  backgroundColor: active ? alpha(meta.color, 0.14) : c.surface,
                  borderWidth: 1.5,
                  borderColor: active ? meta.color : c.border,
                }}
              >
                <Text
                  className={active ? "font-body-sb text-xs" : "font-body text-xs"}
                  style={{ color: active ? meta.color : c.t3 }}
                >
                  {t(meta.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Genres */}
      {book.genres && book.genres.length > 0 && (
        <View
          className="px-container py-4 border-b"
          style={{ borderBottomColor: alpha(c.border, 0.55) }}
        >
          <View className="flex-row flex-wrap gap-1.5">
            {book.genres.map((g) => (
              <Text
                key={g}
                className="font-body text-xs text-t3 bg-surface border border-border rounded-md px-3 py-[5px]"
              >
                {g}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Synopsis */}
      {book.description && (
        <View
          className="px-container py-4 border-b"
          style={{ borderBottomColor: alpha(c.border, 0.55) }}
        >
          <SectionLabel>{t("book.synopsis")}</SectionLabel>
          <Text
            className="font-body text-xs text-t2 mb-2"
            style={{ lineHeight: 13.5 * 1.76 }}
            numberOfLines={expanded ? undefined : 5}
          >
            {book.description}
          </Text>
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <Text className="font-body-md text-xs text-accent">
              {expanded ? t("book.readLess") : t("book.readMore")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <View
          className="px-container py-4 border-b"
          style={{ borderBottomColor: alpha(c.border, 0.55) }}
        >
          <SectionLabel>{t("book.details")}</SectionLabel>
          <View className="rounded-card overflow-hidden border border-border bg-surface">
            {detailRows.map((row, i) => (
              <View
                key={row.label}
                className="flex-row justify-between items-center px-4 border-b border-border"
                style={{
                  paddingVertical: 11,
                  borderBottomWidth: i < detailRows.length - 1 ? 1 : 0,
                }}
              >
                <Text className="font-body text-xs text-t3">{row.label}</Text>
                <Text className="font-body-md text-xs text-text">{row.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mi calificación */}
      <View
        className="px-container py-4 border-b"
        style={{ borderBottomColor: alpha(c.border, 0.55) }}
      >
        <SectionLabel>{t("book.myRating")}</SectionLabel>
        <View className="rounded-card p-4 border border-border bg-surface">
          <View className="flex-row justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => {
              const on = (rHover ?? rating ?? 0) >= i;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => onRatingClick(i)}
                  disabled={isPending}
                  hitSlop={4}
                >
                  <View
                    className="items-center justify-center relative w-[38px] h-9"
                  >
                    {/* Empty star background */}
                    <Text
                      className="text-2xl absolute"
                      style={{ lineHeight: 36, color: alpha(STAR, 0.22) }}
                    >
                      ★
                    </Text>
                    {/* Half star (rating = i - 0.5) */}
                    {rating != null && rating === i - 0.5 && rHover == null && (
                      <View
                        className="absolute left-0 overflow-hidden w-[19px]"
                      >
                        <Text
                          className="text-2xl leading-9 text-star"
                        >
                          ★
                        </Text>
                      </View>
                    )}
                    {/* Full star */}
                    {on && (
                      <Text
                        className="text-2xl absolute leading-9 text-star"
                      >
                        ★
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text className="font-body text-xs text-t3 text-center">
            {rating != null ? t("book.ratingValue", { rating }) : t("book.tapToRate")}
          </Text>
        </View>
      </View>

      {/* Write review CTA */}
      <View className="px-container pt-4">
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          className="py-3.5 rounded-card bg-accent items-center"
        >
          <Text className="font-body-sb text-sm text-white tracking-tight">
            {t("book.writeMyReview")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
