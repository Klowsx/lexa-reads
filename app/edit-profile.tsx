import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { ME } from '~/mock';
import { useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const GENRES = [
  'Fantasía', 'Realismo mágico', 'Ciencia ficción', 'Misterio',
  'Romance', 'Dark Academia', 'Clásicos', 'Memorias',
  'Historia', 'Thriller', 'Poesía', 'Horror',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [name, setName] = useState(ME.name);
  const [username, setUsername] = useState(ME.username);
  const [bio, setBio] = useState(ME.bio);
  const [selectedGenres, setSelectedGenres] = useState(['Fantasía', 'Clásicos']);

  const canSave = name.trim().length >= 2 && username.trim().length >= 3;

  function toggleGenre(g: string) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
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
          Editar perfil
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
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Avatar */}
        <View
          className="items-center py-6 border-b border-border"
          style={{ backgroundColor: alpha(ME.avC, 0.04) }}
        >
          <Avatar user={ME} size={80} />
          <Pressable
            className="mt-3 px-4 py-2 rounded-md bg-sh border border-border"
          >
            <Text className="text-xs font-body-md text-text">Cambiar foto</Text>
          </Pressable>
          <Text className="text-xs font-body text-t3 mt-1.5">JPG, PNG · Máx. 5 MB</Text>
        </View>

        <View className="px-5 pt-6">
          {/* Nombre */}
          <View className="mb-4">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
              Nombre
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={50}
              className="rounded-md border border-border font-body text-sm text-text"
              style={{
                paddingHorizontal: 14,
                paddingVertical: 11,
                backgroundColor: c.surface,
              }}
              placeholderTextColor={c.t3}
            />
          </View>

          {/* Usuario */}
          <View className="mb-4">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
              Usuario
            </Text>
            <View
              className="flex-row items-center rounded-md border border-border overflow-hidden"
              style={{ backgroundColor: c.surface }}
            >
              <View
                className="px-3 py-3 border-r border-border"
                style={{ backgroundColor: c.sh }}
              >
                <Text className="text-sm font-body text-t3">@</Text>
              </View>
              <TextInput
                value={username}
                onChangeText={(v) => setUsername(v.toLowerCase().replace(/\s/g, ''))}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 font-body text-sm text-text"
                style={{ paddingHorizontal: 12, paddingVertical: 11 }}
                placeholderTextColor={c.t3}
              />
            </View>
            <Text className="text-xs font-body text-t3 mt-1">
              lexa.app/@{username || '…'}
            </Text>
          </View>

          {/* Bio */}
          <View className="mb-6">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={160}
              placeholder="Cuéntanos sobre tus lecturas..."
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
              {bio.length}/160
            </Text>
          </View>

          {/* Géneros favoritos */}
          <View className="mb-8">
            <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">
              Géneros favoritos
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {GENRES.map((g) => {
                const active = selectedGenres.includes(g);
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGenre(g)}
                    className="px-3 py-1.5 rounded-full border"
                    style={{
                      backgroundColor: active ? alpha(c.accent, 0.14) : c.sh,
                      borderColor: active ? c.accent : c.border,
                    }}
                  >
                    <Text
                      className="text-xs font-body"
                      style={{ color: active ? c.accent : c.t2 }}
                    >
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => canSave && router.back()}
            disabled={!canSave}
            className="py-3.5 rounded-md items-center mb-2"
            style={{ backgroundColor: canSave ? c.accent : alpha(c.accent, 0.4) }}
          >
            <Text className="text-sm font-body-sb text-white">Guardar cambios</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
