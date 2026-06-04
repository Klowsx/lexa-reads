import { useRouter } from "expo-router";
import { ChevronLeft, Globe, Lock } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateClub } from "~/features/clubs/hooks/useCreateClub";
import type { ClubVisibility } from "~/features/clubs/clubs.queries";
import { useColors } from "~/theme/colors";

export default function NewClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ClubVisibility>("public");

  const create = useCreateClub();
  const canSubmit = name.trim().length >= 3 && !create.isPending;

  function submit() {
    if (!canSubmit) return;
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined, visibility },
      { onSuccess: ({ slug }) => router.replace(`/club/${slug}`) },
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 border-b border-border flex-row items-center gap-2">
        <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight flex-1">Nuevo club</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase">Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Club de fantasía en español"
            placeholderTextColor={c.t3}
            maxLength={100}
            className="text-sm font-body text-text bg-sh border border-border rounded-md px-3 py-2.5"
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase">Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿De qué trata el club?"
            placeholderTextColor={c.t3}
            multiline
            maxLength={500}
            className="text-sm font-body text-text bg-sh border border-border rounded-md px-3 py-2.5 min-h-[90px]"
            style={{ textAlignVertical: "top" }}
          />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-body-sb text-t2 tracking-widest uppercase">Privacidad</Text>
          {([
            { v: "public", icon: Globe, title: "Público", desc: "Cualquiera puede encontrarlo y unirse al instante." },
            { v: "private", icon: Lock, title: "Privado", desc: "Solo por invitación; no aparece en búsqueda." },
          ] as const).map(({ v, icon: Icon, title, desc }) => {
            const sel = visibility === v;
            return (
              <Pressable
                key={v}
                onPress={() => setVisibility(v)}
                className="flex-row items-start gap-3 p-3 rounded-md border"
                style={{ borderColor: sel ? c.accent : c.border, backgroundColor: sel ? c.sh : "transparent" }}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
              >
                <Icon size={18} color={sel ? c.accent : c.t3} strokeWidth={1.8} />
                <View className="flex-1">
                  <Text className="text-sm font-body-sb text-text">{title}</Text>
                  <Text className="text-xs font-body text-t2 mt-0.5">{desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className="py-3.5 rounded-md items-center bg-accent mt-2"
          style={{ opacity: canSubmit ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="Crear club"
        >
          {create.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-body-sb text-white">Crear club</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
