import { BookMarked } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { BookCover } from '~/components/ui/BookCover';
import { useColors } from '~/theme/colors';
import type { Tables } from '~/types/database';

interface Props {
  book: Tables<'books'>;
  onPress: () => void;
  onQuickPeek: () => void;
}

export function BookCard({ book, onPress, onQuickPeek }: Props) {
  const c = useColors();
  const [pagesInfoVisible, setPagesInfoVisible] = useState(false);

  return (
    <View className="flex-row bg-surface rounded-md border border-border mb-2.5 overflow-hidden">
      <Pressable
        onPress={onPress}
        className="flex-row gap-3 p-3 flex-1 min-w-0"
      >
        <BookCover book={book} width={44} height={66} />
        <View className="flex-1 min-w-0">
          <Text
            className="font-display-sb text-sm text-text leading-tight mb-0.5"
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text className="font-body text-sm text-t2 mb-1.5" numberOfLines={1}>
            {book.authors?.join(', ')}
          </Text>
          <View className="flex-row items-center gap-1.5 mb-1">
            {book.page_count ? (
              <>
                <Text className="font-body text-xs text-t3">{book.page_count} págs.</Text>
                <Pressable
                  onPress={() => setPagesInfoVisible(true)}
                  hitSlop={8}
                  className="w-3.5 h-3.5 rounded-full border border-t3 items-center justify-center"
                >
                  <Text className="text-t3 font-body-sb text-xs leading-[11px]">i</Text>
                </Pressable>
              </>
            ) : null}
            {book.published_year ? (
              <Text className="font-body text-xs text-t3">
                {book.page_count ? '· ' : ''}{book.published_year}
              </Text>
            ) : null}
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

      <Pressable
        onPress={onQuickPeek}
        hitSlop={8}
        className="justify-center px-3"
      >
        <BookMarked size={16} color={c.t3} strokeWidth={1.5} />
      </Pressable>

      <Modal
        visible={pagesInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPagesInfoVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setPagesInfoVisible(false)}
        >
          <Pressable
            className="bg-surface rounded-t-xl px-6 pt-6 pb-10 gap-3"
            onPress={() => {}}
          >
            <Text className="font-display-sb text-lg text-text">
              Número de páginas
            </Text>
            <Text className="font-body text-sm text-t2 leading-5">
              La cantidad de páginas puede variar según la editorial y la edición del libro — tapa dura, bolsillo, ilustrada, etc.
            </Text>
            <Text className="font-body text-sm text-t2 leading-5">
              El número que ves aquí corresponde a la edición registrada en nuestra base de datos y es solo orientativo.
            </Text>
            <Pressable
              onPress={() => setPagesInfoVisible(false)}
              className="mt-2 bg-accent rounded-lg py-3 items-center"
            >
              <Text className="font-body-sb text-sm text-white">Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
