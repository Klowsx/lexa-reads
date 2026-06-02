import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ChevronLeft, MoreHorizontal, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { BookDetailSheet } from '~/features/book/components/BookDetailSheet';
import { LIST_BOOKS, MOCK_LISTS, type MockBook } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const GOLD = '#E8C05A';
const HERO_H = 252;

const BOOK_POSITIONS = [
  { left: -10, top: 30, rot: '-14deg' },
  { left: 58,  top: 60, rot: '6deg'  },
  { left: 150, top: 20, rot: '-8deg' },
  { left: 220, top: 50, rot: '10deg' },
];

// ─── Frosted-glass circular button ───────────────────────────

function HeroBtn({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: pressed ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.38)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {children}
    </Pressable>
  );
}

// ─── Pill tag ─────────────────────────────────────────────────

function Pill({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'DMSans_600SemiBold',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Options bottom sheet ─────────────────────────────────────

function OptionsSheet({
  visible,
  isFeatured,
  onClose,
  onChangeCover,
  onToggleFeatured,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  isFeatured: boolean;
  onClose: () => void;
  onChangeCover: () => void;
  onToggleFeatured: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = useColors();

  const options = [
    {
      label: 'Cambiar portada',
      color: c.t2,
      onPress: () => { onChangeCover(); onClose(); },
    },
    {
      label: isFeatured ? 'Quitar de destacadas' : 'Destacar en perfil',
      color: GOLD,
      onPress: () => { onToggleFeatured(); onClose(); },
    },
    {
      label: 'Editar lista',
      color: c.t2,
      onPress: () => { onClose(); onEdit(); },
    },
    {
      label: 'Eliminar lista',
      color: c.error,
      onPress: () => { onDelete(); onClose(); },
    },
  ];

  if (!visible) return null;

  return (
    <Pressable
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}
      onPress={onClose}
    >
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      />
      <Pressable
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          backgroundColor: c.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 36,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, backgroundColor: c.border, borderRadius: 100 }} />
        </View>

        {options.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={opt.onPress}
            style={({ pressed }) => ({
              paddingVertical: 14,
              paddingHorizontal: 22,
              backgroundColor: pressed ? c.sh : 'transparent',
            })}
          >
            <Text style={{ fontSize: 15, fontFamily: 'DMSans_500Medium', color: opt.color }}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </Pressable>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ListDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const list = MOCK_LISTS.find((l) => l.id === slug) ?? MOCK_LISTS[0];
  const books = LIST_BOOKS[list.id] ?? [];

  const [isFeatured, setIsFeatured] = useState(!!list.featured);
  const [showMenu, setShowMenu] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<MockBook | null>(null);

  async function handlePickCover() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso a tu galería para cambiar la portada.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Eliminar lista',
      `¿Eliminar "${list.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  const pills = [
    `${books.length} libros`,
    list.visibility,
    isFeatured ? '★ Destacada' : null,
  ].filter(Boolean) as string[];

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Hero ── */}
        <View style={{ height: HERO_H, overflow: 'hidden' }}>

          {/* Background: custom photo OR gradient + book covers */}
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              contentFit="cover"
            />
          ) : (
            <>
              <LinearGradient
                colors={[alpha(list.col, 0.35), list.col]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              {books.slice(0, 4).map((book, i) => {
                const pos = BOOK_POSITIONS[i] ?? { left: i * 80, top: 40, rot: '0deg' };
                return (
                  <View
                    key={book.id}
                    style={{
                      position: 'absolute',
                      left: pos.left,
                      top: pos.top,
                      transform: [{ rotate: pos.rot }],
                      opacity: 0.55,
                    }}
                  >
                    <MockBookCover book={book} width={72} height={108} />
                  </View>
                );
              })}
            </>
          )}

          {/* Scrim — top + bottom */}
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.72)']}
            locations={[0, 0.3, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Nav bar */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 6,
              left: 14,
              right: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <HeroBtn onPress={() => router.back()}>
              <ChevronLeft size={18} color="#fff" strokeWidth={2} />
            </HeroBtn>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Camera button — always visible */}
              <HeroBtn onPress={handlePickCover}>
                <Camera size={15} color="#fff" strokeWidth={2} />
              </HeroBtn>

              <HeroBtn onPress={() => setIsFeatured((f) => !f)}>
                <Star
                  size={15}
                  color={isFeatured ? GOLD : '#fff'}
                  fill={isFeatured ? GOLD : 'transparent'}
                  strokeWidth={1.9}
                />
              </HeroBtn>

              <HeroBtn onPress={() => setShowMenu(true)}>
                <MoreHorizontal size={15} color="#fff" strokeWidth={2} />
              </HeroBtn>
            </View>
          </View>

          {/* Title + pills */}
          <View
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              padding: 18,
              paddingBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontFamily: 'PlayfairDisplay_700Bold',
                color: '#fff',
                lineHeight: 31,
                marginBottom: 10,
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
              numberOfLines={2}
            >
              {list.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {pills.map((tag) => (
                <Pill key={tag} label={tag} />
              ))}
            </View>
          </View>
        </View>

        {/* ── Description ── */}
        {list.desc ? (
          <Text
            className="text-t2"
            style={{
              paddingHorizontal: 18,
              paddingTop: 18,
              fontSize: 13.5,
              fontFamily: 'PlayfairDisplay_400Regular_Italic',
              lineHeight: 22,
            }}
          >
            "{list.desc}"
          </Text>
        ) : null}

        {/* ── Books header ── */}
        <View className="flex-row justify-between items-center px-4 pt-5 pb-3.5">
          <Text className="font-body-sb text-xs text-t3 tracking-widest uppercase">
            Libros
          </Text>
          <Pressable onPress={() => router.navigate('/(tabs)/search' as any)} hitSlop={6}>
            <Text className="text-xs font-body-sb text-accent">+ Agregar</Text>
          </Pressable>
        </View>

        {/* ── Books grid ── */}
        {books.length === 0 ? (
          <View
            className="mx-4 rounded-lg border border-border bg-surface items-center"
            style={{ paddingVertical: 36, paddingHorizontal: 20, marginBottom: 40 }}
          >
            <Text style={{ fontSize: 32, marginBottom: 10 }}>📚</Text>
            <Text className="text-sm font-body-md text-t2 mb-1.5">Lista vacía</Text>
            <Text className="text-xs font-body text-t3">
              Toca «+ Agregar» para añadir libros
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: 16,
              gap: 12,
              paddingBottom: 40,
            }}
          >
            {books.map((book, i) => (
              <Pressable
                key={`${book.id}-${i}`}
                onPress={() => setSelectedBook(book)}
                style={{ width: 100 }}
              >
                <MockBookCover book={book} width={100} height={150} />
                <Text
                  className="text-xs font-body-md text-t2 mt-1.5"
                  style={{ lineHeight: 15, width: 100 }}
                  numberOfLines={2}
                >
                  {book.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Options sheet ── */}
      <OptionsSheet
        visible={showMenu}
        isFeatured={isFeatured}
        onClose={() => setShowMenu(false)}
        onChangeCover={handlePickCover}
        onToggleFeatured={() => setIsFeatured((f) => !f)}
        onEdit={() => router.push({ pathname: '/list/edit/[slug]', params: { slug: list.id } } as any)}
        onDelete={handleDelete}
      />

      {selectedBook && (
        <BookDetailSheet book={selectedBook as any} onClose={() => setSelectedBook(null)} />
      )}
    </View>
  );
}
