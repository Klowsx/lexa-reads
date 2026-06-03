import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '~/components/ui/Avatar';
import { getAvatarColor } from '~/lib/avatar';
import { useColors } from '~/theme/colors';
import type { UserProfile } from '~/types/user';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

const alpha = (hex: string, op: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${op})`;
};

const GENRES = [
  'Fantasía', 'Realismo mágico', 'Ciencia ficción', 'Misterio',
  'Romance', 'Dark Academia', 'Clásicos', 'Memorias', 'Historia', 'Thriller',
];

interface Props {
  user: UserProfile;
  onClose: () => void;
}

export function EditProfileSheet({ user, onClose }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const color = getAvatarColor(user.username);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    user.favorite_genres ?? [],
  );

  useEffect(() => {
    setName(user.display_name);
    setBio(user.bio ?? '');
    setSelectedGenres(user.favorite_genres ?? []);
  }, [user]);

  const toggleGenre = (g: string) =>
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );

  function handleSave() {
    updateProfile(
      {
        display_name: name.trim(),
        bio: bio.trim() || null,
        favorite_genres: selectedGenres.length > 0 ? selectedGenres : null,
      },
      { onSuccess: onClose },
    );
  }

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
          className="absolute inset-0 bg-black/[0.72]"
        />

        <View
          className="rounded-t-xl overflow-hidden bg-surface"
          style={{ maxHeight: '90%', paddingBottom: insets.bottom + 12 }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="flex-row justify-between items-center px-5 pt-3 pb-4">
            <Text className="font-display-sb text-md text-text">Editar perfil</Text>
            <Pressable onPress={onClose} hitSlop={8} className="w-8 h-8 items-center justify-center">
              <Text className="text-lg font-body text-t2">×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="flex-row items-center gap-4 px-5 pb-5">
              <Avatar
                displayName={user.display_name}
                username={user.username}
                avatarUrl={user.avatar_url}
                size={66}
              />
              <View>
                <Pressable className="px-4 py-2 rounded-md bg-sh border border-border mb-1.5">
                  <Text className="text-xs font-body-md text-text">Cambiar foto</Text>
                </Pressable>
                <Text className="text-xs font-body text-t3">JPG, PNG o GIF · Máx. 5 MB</Text>
              </View>
            </View>

            <View className="px-5">
              <View className="mb-3.5">
                <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-1.5">
                  Nombre
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  className="rounded-md bg-sr border border-border text-text font-body text-sm px-[14px] py-[11px]"
                  placeholderTextColor={c.t3}
                />
              </View>

              <View className="mb-[18px]">
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
                  className="rounded-md bg-sr border border-border text-text font-body text-sm"
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    lineHeight: 22,
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor={c.t3}
                />
                <Text className="text-xs font-body text-t3 text-right mt-1">
                  {bio.length}/160
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-xs font-body-sb text-t3 tracking-widest uppercase mb-2">
                  Géneros favoritos
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {GENRES.map((g) => {
                    const active = selectedGenres.includes(g);
                    return (
                      <Pressable
                        key={g}
                        onPress={() => toggleGenre(g)}
                        className="px-3 py-1.5 rounded-full border"
                        style={{
                          backgroundColor: active ? alpha(color, 0.14) : undefined,
                          borderColor: active ? color : undefined,
                        }}
                      >
                        <Text
                          className={`text-xs font-body ${active ? '' : 'text-t2'}`}
                          style={active ? { color } : undefined}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleSave}
                disabled={isPending || !name.trim()}
                className="py-3 rounded-md items-center mb-1 bg-accent"
                style={{ opacity: isPending || !name.trim() ? 0.6 : 1 }}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-body-sb text-white">Guardar cambios</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
