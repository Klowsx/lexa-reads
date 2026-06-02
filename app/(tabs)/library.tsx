import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { BookDetailSheet } from "~/features/book/components/BookDetailSheet";
import { LibraryItem } from "~/features/library/components/LibraryItem";
import { LibraryTabs } from "~/features/library/components/LibraryTabs";
import { useLibrary } from "~/features/library/hooks/useLibrary";
import { useLibraryCounts } from "~/features/library/hooks/useLibraryCounts";
import { type BookStatus } from "~/lib/book-status";
import { fixed, rawDark, rawLight } from "~/theme/colors";
import { cn } from '~/lib/utils';
import type { Tables } from "~/types/database";
import { useColorScheme } from "react-native";

const ITEM_WIDTH = 96;
// Altura estimada de cada item para que FlashList pueda calcular el scroll correctamente
const ESTIMATED_ITEM_HEIGHT = Math.round(ITEM_WIDTH * 1.52) + 40;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  const [activeTab, setActiveTab] = useState<BookStatus>("reading");
  // Tag seleccionado para filtrar dentro del tab activo (null = sin filtro)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  // Libro seleccionado para el bottom sheet de detalle
  const [selectedBook, setSelectedBook] = useState<Tables<"books"> | null>(
    null,
  );

  const { data: items = [], isLoading } = useLibrary(activeTab);
  const { data: counts } = useLibraryCounts();

  // Mientras los contadores cargan usamos 0 para no romper el layout
  const countByStatus = {
    reading: counts?.reading ?? 0,
    read: counts?.read ?? 0,
    want_to_read: counts?.want_to_read ?? 0,
    abandoned: counts?.abandoned ?? 0,
  } satisfies Record<BookStatus, number>;

  // Tags únicos presentes en los items del tab activo, ordenados alfabéticamente
  const availableTags = Array.from(
    new Set(items.flatMap((item) => item.tags ?? [])),
  ).sort();

  // Lista final: opcionalmente filtrada por tag
  const shown = selectedTag
    ? items.filter((item) => item.tags?.includes(selectedTag))
    : items;

  // Al cambiar de tab, reseteamos el filtro de tag para no confundir al usuario
  function handleTabChange(status: BookStatus) {
    setActiveTab(status);
    setSelectedTag(null);
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-2.5 pb-0">
        <Text className="font-display-sb text-xl text-text tracking-tight mb-3">
          Mi biblioteca
        </Text>
        <LibraryTabs
          activeTab={activeTab}
          countByStatus={countByStatus}
          onTabChange={handleTabChange}
        />
      </View>

      {/* Chips de filtro por tag — solo se muestran si el usuario tiene tags asignados */}
      {availableTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          {/* Chip "Todos" para quitar el filtro */}
          <Pressable
            onPress={() => setSelectedTag(null)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 100,
              backgroundColor: selectedTag === null ? fixed.accent : raw.sh,
              borderWidth: 1,
              borderColor: selectedTag === null ? fixed.accent : raw.border,
            }}
          >
            <Text
              className={cn("text-xs font-body-md", selectedTag === null ? "text-white" : "text-t2")}
            >
              Todos
            </Text>
          </Pressable>

          {availableTags.map((tag) => {
            const active = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag(active ? null : tag)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 100,
                  backgroundColor: active ? fixed.accent : raw.sh,
                  borderWidth: 1,
                  borderColor: active ? fixed.accent : raw.border,
                }}
              >
                <Text
                  className={cn("text-xs font-body-md", active ? "text-white" : "text-t2")}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fixed.accent} />
        </View>
      ) : (
        <FlashList
          data={shown}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingTop: 16,
            paddingBottom: 72,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LibraryItem
              item={item}
              itemWidth={ITEM_WIDTH}
              onPress={() => item.books && setSelectedBook(item.books)}
            />
          )}
          ListEmptyComponent={
            <View
            className="items-center justify-center py-20 px-8 gap-3"
            >
              <Text className="text-t3 font-body text-sm text-center">
                {selectedTag
                  ? `No hay libros con la etiqueta "${selectedTag}".`
                  : "No hay libros en esta lista todavía."}
              </Text>
              {/* CTA a búsqueda solo cuando no hay filtro activo */}
              {!selectedTag && (
                <Pressable
                  onPress={() => router.navigate("/(tabs)/search")}
                  className="px-5 py-2.5 rounded-lg bg-accent"
                >
                  <Text
                    className="text-white text-sm font-body-md"
                  >
                    Buscar libros
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {selectedBook && (
        <BookDetailSheet
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </View>
  );
}
