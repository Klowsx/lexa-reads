import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MockBookCover } from '~/components/ui/MockBookCover';
import { LIST_BOOKS, MOCK_LISTS, type MockBook } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const LIST_COLORS = [
  '#4A96B8', '#8A6CD8', '#5CAF7E', '#C4783A',
  '#8B3A3A', '#2A8A8A', '#C4903A', '#6A635C',
];

type Visibility = 'Pública' | 'Privada';

export default function EditListScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const list = MOCK_LISTS.find((l) => l.id === slug) ?? MOCK_LISTS[0];
  const initialBooks = LIST_BOOKS[list.id] ?? [];

  const [name, setName] = useState(list.name);
  const [desc, setDesc] = useState(list.desc ?? '');
  const [visibility, setVisibility] = useState<Visibility>(
    list.visibility as Visibility
  );
  const [color, setColor] = useState(list.col);
  const [books, setBooks] = useState<MockBook[]>(initialBooks);

  const canSave = name.trim().length >= 2;

  function removeBook(id: number) {
    Alert.alert('Quitar libro', '¿Quitar este libro de la lista?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => setBooks((prev) => prev.filter((b) => b.id !== id)),
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">
          Editar lista
        </Text>
        <Pressable hitSlop={8} onPress={() => canSave && router.back()} disabled={!canSave}>
          <Text
            className="text-sm font-body-sb"
            style={{ color: canSave ? c.accent : c.t3 }}
          >
            Guardar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
      >
        {/* Preview */}
        <View
          className="rounded-md mb-6 px-4 py-4 flex-row items-center gap-3"
          style={{
            backgroundColor: alpha(color, 0.1),
            borderWidth: 1,
            borderColor: alpha(color, 0.28),
          }}
        >
          <View
            className="rounded-sm shrink-0"
            style={{ width: 4, height: 40, backgroundColor: color }}
          />
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-body-sb text-text" numberOfLines={1}>
              {name.trim() || 'Nombre de la lista'}
            </Text>
            <Text className="text-xs font-body text-t3 mt-0.5">
              {books.length} libros · {visibility}
            </Text>
          </View>
        </View>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
            Nombre
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={60}
            className="rounded-md border border-border font-body text-sm text-text"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 11,
              backgroundColor: c.surface,
            }}
            placeholderTextColor={c.t3}
          />
          <Text className="text-xs font-body text-t3 text-right mt-1">
            {name.length}/60
          </Text>
        </View>

        {/* Descripción */}
        <View className="mb-4">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
            Descripción <Text className="normal-case tracking-normal">(opcional)</Text>
          </Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="¿De qué trata esta lista?"
            multiline
            numberOfLines={3}
            maxLength={200}
            className="rounded-md border border-border font-body text-sm text-text"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 11,
              lineHeight: 22,
              textAlignVertical: 'top',
              backgroundColor: c.surface,
            }}
            placeholderTextColor={c.t3}
          />
          <Text className="text-xs font-body text-t3 text-right mt-1">
            {desc.length}/200
          </Text>
        </View>

        {/* Visibilidad */}
        <View className="mb-6">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">
            Visibilidad
          </Text>
          <View className="flex-row rounded-md bg-sh p-1 border border-border">
            {(['Pública', 'Privada'] as Visibility[]).map((v) => {
              const active = visibility === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => setVisibility(v)}
                  className="flex-1 items-center py-2 rounded-sm"
                  style={{ backgroundColor: active ? c.accent : 'transparent' }}
                >
                  <Text
                    className="text-xs font-body-sb"
                    style={{ color: active ? '#fff' : c.t3 }}
                  >
                    {v}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color */}
        <View className="mb-6">
          <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">
            Color
          </Text>
          <View className="flex-row gap-3 flex-wrap">
            {LIST_COLORS.map((col) => {
              const active = color === col;
              return (
                <Pressable
                  key={col}
                  onPress={() => setColor(col)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: col,
                    borderWidth: active ? 3 : 2,
                    borderColor: active ? c.text : 'transparent',
                    shadowColor: col,
                    shadowOpacity: active ? 0.5 : 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: active ? 4 : 0,
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* Libros */}
        <View className="mb-8">
          <View className="flex-row justify-between items-baseline mb-3">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase">
              Libros · {books.length}
            </Text>
            <Pressable
              onPress={() => router.navigate('/(tabs)/search' as any)}
              hitSlop={6}
            >
              <Text className="text-xs font-body-sb text-accent">+ Agregar</Text>
            </Pressable>
          </View>

          {books.length === 0 ? (
            <View
              className="rounded-md border border-border items-center py-8"
              style={{ backgroundColor: c.surface }}
            >
              <Text className="text-xs font-body text-t3">Lista vacía</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {books.map((book) => (
                <View
                  key={book.id}
                  className="flex-row items-center gap-3 rounded-md border border-border px-3 py-2.5"
                  style={{ backgroundColor: c.surface }}
                >
                  <MockBookCover book={book} width={40} height={58} />
                  <View className="flex-1 min-w-0">
                    <Text
                      className="text-xs font-body-sb text-text"
                      numberOfLines={1}
                    >
                      {book.title}
                    </Text>
                    <Text className="text-xs font-body text-t3 mt-0.5">
                      {book.author}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeBook(book.id)}
                    hitSlop={8}
                    className="p-2"
                  >
                    <Trash2 size={15} color={c.error} strokeWidth={1.8} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => canSave && router.back()}
          disabled={!canSave}
          className="py-3.5 rounded-md items-center"
          style={{ backgroundColor: canSave ? c.accent : alpha(c.accent, 0.4) }}
        >
          <Text className="text-sm font-body-sb text-white">Guardar cambios</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
