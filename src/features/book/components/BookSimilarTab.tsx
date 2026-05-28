import { Pressable, Text, View } from "react-native";
import { BookCover } from "~/components/ui/BookCover";
import { StarRating } from "~/components/ui/StarRating";
import { rawDark, rawLight } from "~/theme/colors";
import { useColorScheme } from "react-native";
import type { Tables } from "~/types/database";

// Maps BOOKS mock data to the shape BookCover expects
const SIMILAR: Tables<"books">[] = [
  { id: "m1",  google_books_id: "EliL9x1QFZQC", title: "El nombre del viento",  authors: ["Patrick Rothfuss"],       cover_url: null, page_count: 662, published_year: 2007, description: null, genres: ["Fantasía"],         isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m2",  google_books_id: "CDc3AAAAQBAJ", title: "Cien años de soledad",  authors: ["Gabriel García Márquez"], cover_url: null, page_count: 417, published_year: 1967, description: null, genres: ["Realismo mágico"], isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m3",  google_books_id: "T_f7DwAAQBAJ", title: "Normal People",          authors: ["Sally Rooney"],           cover_url: null, page_count: 273, published_year: 2018, description: null, genres: ["Contemporáneo"],    isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m4",  google_books_id: "OkLqEAAAQBAJ", title: "La sombra del viento",  authors: ["Carlos Ruiz Zafón"],      cover_url: null, page_count: 540, published_year: 2001, description: null, genres: ["Misterio"],         isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m5",  google_books_id: "q4OLEAAAQBAJ", title: "The Midnight Library",   authors: ["Matt Haig"],              cover_url: null, page_count: 288, published_year: 2020, description: null, genres: ["Especulativo"],     isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m6",  google_books_id: "BabelKuang22", title: "Babel",                  authors: ["R.F. Kuang"],             cover_url: null, page_count: 545, published_year: 2022, description: null, genres: ["Fantasía"],         isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m7",  google_books_id: "PiranesiBook", title: "Piranesi",               authors: ["Susanna Clarke"],         cover_url: null, page_count: 272, published_year: 2020, description: null, genres: ["Fantasía"],         isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
  { id: "m8",  google_books_id: "KlaraIshiguro", title: "Klara y el sol",        authors: ["Kazuo Ishiguro"],         cover_url: null, page_count: 307, published_year: 2021, description: null, genres: ["Ciencia ficción"],  isbn_10: null, isbn_13: null, language: null, open_library_id: null, published_date: null, publisher: null, created_at: null, updated_at: null },
];

const RATINGS: Record<string, number> = {
  m1: 4.5, m2: 4.8, m3: 4.1, m4: 4.4, m5: 4.0, m6: 4.6, m7: 4.5, m8: 4.2,
};

export function BookSimilarTab() {
  const scheme = useColorScheme();
  const raw = scheme === "dark" ? rawDark : rawLight;

  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {SIMILAR.map((book) => (
          <Pressable
            key={book.id}
            style={{ width: "30%" }}
          >
            <BookCover book={book} height={128} />
            <View style={{ marginTop: 6 }}>
              <Text
                numberOfLines={2}
                className="font-display text-xs"
                style={{
                  color: raw.text,
                  lineHeight: 14,
                }}
              >
                {book.title}
              </Text>
              <Text
                className="font-body text-xs"
                style={{
                  color: raw.t3,
                  marginTop: 2,
                }}
              >
                {book.authors?.[0]?.split(" ").pop()}
              </Text>
              <View style={{ marginTop: 3 }}>
                <StarRating rating={RATINGS[book.id] ?? 4} size={9} />
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
