import { Bell, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Avatar } from '~/components/ui/Avatar';
import { BookCover } from '~/components/ui/BookCover';
import { StarRating } from '~/components/ui/StarRating';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import {
  ACT_LABEL,
  FEED_INIT,
  type MockBook,
  type MockFeedItem,
} from '~/mock';
import { useColors } from '~/lib/colors';

// ─── Feed card ────────────────────────────────────────────────

function FeedCard({
  item,
  onBook,
  onLike,
}: {
  item: MockFeedItem;
  onBook: (book: MockBook) => void;
  onLike: () => void;
}) {
  const c = useColors();

  return (
    <View className="px-4 py-3.5 border-b border-border/80">
      {/* Header row: avatar + activity text */}
      <View className="flex-row gap-2.5 mb-2.5">
        <Avatar user={item.user} size={34} />
        <View className="flex-1">
          <Text className="text-sm text-t2 leading-snug font-body" numberOfLines={2}>
            <Text className="text-text font-body-sb">{item.user.name}</Text>
            {' '}
            {ACT_LABEL[item.type]}
            {' '}
            {item.type === 'added_to_list' ? (
              <>
                <Text className="font-display-i text-text">"{item.book.title}"</Text>
                {' a '}
                <Text style={{ color: c.accent }}>"{item.listName}"</Text>
              </>
            ) : (
              <Text className="font-display-i text-text">"{item.book.title}"</Text>
            )}
          </Text>
          <Text className="text-xs text-t3 font-body mt-0.5">hace {item.time}</Text>
        </View>
      </View>

      {/* Book cover + content */}
      <View className="flex-row gap-3 ml-11">
        <Pressable onPress={() => onBook(item.book)}>
          <BookCover book={item.book} width={48} height={72} />
        </Pressable>
        <View className="flex-1">
          {item.rating != null && (
            <View className="mb-1.5">
              <StarRating rating={item.rating} size={11} />
            </View>
          )}
          {item.preview ? (
            <Text
              className="text-sm text-t2 font-body leading-relaxed"
              numberOfLines={3}
            >
              {item.preview}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Actions */}
      <View
        className="flex-row gap-4 ml-11 mt-2.5 pt-2 border-t"
        style={{ borderTopColor: 'rgba(53,48,43,0.5)' }}
      >
        <Pressable
          onPress={onLike}
          className="flex-row items-center gap-1.5"
          hitSlop={8}
        >
          <Heart
            size={15}
            color={item.liked ? c.accent : c.t3}
            fill={item.liked ? c.accent : 'none'}
          />
          <Text
            className="text-xs font-body"
            style={{ color: item.liked ? c.accent : c.t3 }}
          >
            {item.likes}
          </Text>
        </Pressable>

        <Pressable className="flex-row items-center gap-1.5" hitSlop={8}>
          <MessageCircle size={14} color={c.t3} />
          <Text className="text-xs text-t3 font-body">{item.comments}</Text>
        </Pressable>

        <Pressable className="ml-auto" hitSlop={8}>
          <Share2 size={14} color={c.t3} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [items, setItems] = useState(FEED_INIT);
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  const toggleLike = (id: string) =>
    setItems(prev =>
      prev.map(it =>
        it.id === id
          ? { ...it, liked: !it.liked, likes: it.liked ? it.likes - 1 : it.likes + 1 }
          : it
      )
    );

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center justify-between">
        <Text className="font-display-sb text-xl text-text tracking-tight">lexa</Text>
        <Pressable hitSlop={8}>
          <Bell size={20} color={c.t3} strokeWidth={1.6} />
        </Pressable>
      </View>

      {/* Feed */}
      <FlashList
        data={items}
        renderItem={({ item }) => (
          <FeedCard
            item={item}
            onBook={setSelectedBook}
            onLike={() => toggleLike(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
      />

      {selectedBook && (
        <BookDetailSheet book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
