import { useState } from "react";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { fixed, rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";
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
      className="font-body-sb text-xs text-t3"
      style={{
        textTransform: "uppercase",
        letterSpacing: 1.4,
        marginBottom: 10,
      }}
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
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;
  const [expanded, setExpanded] = useState(false);
  const [rHover, setRHover] = useState<number | null>(null);

  const detailRows = [
    { label: "Editorial", value: book.publisher },
    { label: "Publicado", value: book.published_date },
    { label: "Idioma", value: book.language?.toUpperCase() },
    { label: "Páginas", value: book.page_count?.toString() },
    { label: "ISBN-13", value: book.isbn_13 },
  ].filter((r) => r.value);

  return (
    <View style={{ paddingBottom: 24 }}>
      {/* Status pills */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: alpha(raw.border, 0.55),
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {STATUS_ORDER.map((s) => {
            const meta = STATUS_META[s];
            const active = status === s;
            return (
              <Pressable
                key={s}
                onPress={() => onStatusClick(s)}
                disabled={isPending}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: active
                    ? alpha(meta.color, 0.14)
                    : raw.surface,
                  borderWidth: 1.5,
                  borderColor: active ? meta.color : raw.border,
                }}
              >
                <Text
                  className={active ? "font-body-sb text-xs" : "font-body text-xs"}
                  style={{
                    color: active ? meta.color : raw.t3,
                  }}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Genres */}
      {book.genres && book.genres.length > 0 && (
        <View
          style={{
            paddingHorizontal: 18,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: alpha(raw.border, 0.55),
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {book.genres.map((g) => (
              <Text
                key={g}
                className="font-body text-xs"
                style={{
                  color: raw.t3,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: raw.surface,
                  borderWidth: 1,
                  borderColor: raw.border,
                }}
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
          style={{
            paddingHorizontal: 18,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: alpha(raw.border, 0.55),
          }}
        >
          <SectionLabel>Sinopsis</SectionLabel>
          <Text
            className="font-body text-xs"
            style={{
              color: raw.t2,
              lineHeight: 13.5 * 1.76,
              marginBottom: 8,
            }}
            numberOfLines={expanded ? undefined : 5}
          >
            {book.description}
          </Text>
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <Text
              className="font-body-md text-xs"
              style={{
                color: fixed.accent,
              }}
            >
              {expanded ? "Leer menos ↑" : "Leer más ↓"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <View
          style={{
            paddingHorizontal: 18,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: alpha(raw.border, 0.55),
          }}
        >
          <SectionLabel>Detalles</SectionLabel>
          <View
            style={{
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: raw.border,
              backgroundColor: raw.surface,
            }}
          >
            {detailRows.map((row, i) => (
              <View
                key={row.label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderBottomWidth: i < detailRows.length - 1 ? 1 : 0,
                  borderBottomColor: raw.border,
                }}
              >
                <Text
                  className="font-body text-xs"
                  style={{
                    color: raw.t3,
                  }}
                >
                  {row.label}
                </Text>
                <Text
                  className="font-body-md text-xs"
                  style={{
                    color: raw.text,
                  }}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mi calificación */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: alpha(raw.border, 0.55),
        }}
      >
        <SectionLabel>Mi calificación</SectionLabel>
        <View
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: raw.border,
            backgroundColor: raw.surface,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
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
                    style={{
                      width: 38,
                      height: 36,
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Empty star background */}
                    <Text
                      className="text-2xl"
                      style={{
                        position: "absolute",
                        lineHeight: 36,
                        color: alpha(STAR, 0.22),
                      }}
                    >
                      ★
                    </Text>
                    {/* Half star (rating = i - 0.5) */}
                    {rating != null && rating === i - 0.5 && rHover == null && (
                      <View
                        style={{
                          position: "absolute",
                          left: 0,
                          width: 19,
                          overflow: "hidden",
                        }}
                      >
                        <Text
                          className="text-2xl"
                          style={{
                            lineHeight: 36,
                            color: STAR,
                          }}
                        >
                          ★
                        </Text>
                      </View>
                    )}
                    {/* Full star */}
                    {on && (
                      <Text
                        className="text-2xl"
                        style={{
                          position: "absolute",
                          lineHeight: 36,
                          color: STAR,
                        }}
                      >
                        ★
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text
            className="font-body text-xs"
            style={{
              color: raw.t3,
              textAlign: "center",
            }}
          >
            {rating != null ? `Tu calificación: ${rating} ★` : "Toca para calificar"}
          </Text>
        </View>
      </View>

      {/* Write review CTA */}
      <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
        <TouchableOpacity
          onPress={onWriteReview}
          activeOpacity={0.85}
          style={{
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: fixed.accent,
            alignItems: "center",
          }}
        >
          <Text
            className="font-body-sb text-sm"
            style={{
              color: "#fff",
              letterSpacing: 0.1,
            }}
          >
            Escribir mi reseña
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
