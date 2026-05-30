import { useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MockMe } from '~/mock';
import { rawDark, rawLight, useColors } from '~/theme/colors';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const GENRES = [
  'Fantasía', 'Realismo mágico', 'Ciencia ficción', 'Misterio',
  'Romance', 'Dark Academia', 'Clásicos', 'Memorias', 'Historia', 'Thriller',
];

interface Props {
  user: MockMe;
  onClose: () => void;
}

export function EditProfileSheet({ user, onClose }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const raw = scheme === 'dark' ? rawDark : rawLight;

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [selectedGenres, setSelectedGenres] = useState(['Fantasía', 'Clásicos']);

  const toggleGenre = (g: string) =>
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );

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
          onPress={onClose}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        />

        <View
          className="rounded-t-xl overflow-hidden"
          style={{
            backgroundColor: raw.surface,
            maxHeight: '90%',
            paddingBottom: insets.bottom + 12,
          }}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-3 pb-4">
            <Text className="font-display-sb text-md text-text">Editar perfil</Text>
            <Pressable onPress={onClose} hitSlop={8} className="w-8 h-8 items-center justify-center">
              <Text className="text-lg font-body text-t2">×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Avatar row */}
            <View className="flex-row items-center gap-4 px-5 pb-5">
              <View
                className="rounded-full items-center justify-center shrink-0"
                style={{
                  width: 66,
                  height: 66,
                  backgroundColor: alpha(user.avC, 0.14),
                  borderWidth: 2.5,
                  borderColor: user.avC,
                }}
              >
                <Text style={{ fontSize: 22, color: user.avC, fontFamily: 'DMSans_600SemiBold' }}>
                  {user.av}
                </Text>
              </View>
              <View>
                <Pressable className="px-4 py-2 rounded-md bg-sh border border-border mb-1.5">
                  <Text className="text-xs font-body-md text-text">Cambiar foto</Text>
                </Pressable>
                <Text className="text-xs font-body text-t3">JPG, PNG o GIF · Máx. 5 MB</Text>
              </View>
            </View>

            <View className="px-5">
              {/* Name */}
              <View className="mb-3.5">
                <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
                  Nombre
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="rounded-md bg-sr border border-border text-text"
                  style={{ paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: 'DMSans_400Regular' }}
                  placeholderTextColor={c.t3}
                />
              </View>

              {/* Bio */}
              <View className="mb-4.5">
                <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
                  Bio
                </Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  className="rounded-md bg-sr border border-border text-text"
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    fontSize: 14,
                    fontFamily: 'DMSans_400Regular',
                    lineHeight: 22,
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor={c.t3}
                  maxLength={160}
                />
                <Text className="text-xs font-body text-t3 text-right mt-1">{bio.length}/160</Text>
              </View>

              {/* Genre chips */}
              <View className="mb-6">
                <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">
                  Géneros favoritos
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {GENRES.map(g => {
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
                onPress={onClose}
                className="py-3 rounded-md items-center mb-1"
                style={{ backgroundColor: c.accent }}
              >
                <Text className="text-sm font-body-sb" style={{ color: '#fff' }}>
                  Guardar cambios
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
