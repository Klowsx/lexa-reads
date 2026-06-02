import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsItem } from "~/features/user/components/SettingsItem";
import { SettingsSection } from "~/features/user/components/SettingsSection";
import { SettingsToggle } from "~/features/user/components/SettingsToggle";
import {
  useNotificationPreferences,
  useUpsertNotificationPreferences,
} from "~/features/user/hooks/useNotificationPreferences";
import { registerPushToken, useSavePushToken } from "~/features/notifications/hooks/usePushOptIn";
import { useColors } from "~/theme/colors";

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useColors();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const upsert = useUpsertNotificationPreferences();
  const savePushToken = useSavePushToken();

  // push_token not yet in generated types — use `as any` (migration 011)
  const pushToken = (prefs as any)?.push_token as string | null | undefined;
  const pushEnabled = !!pushToken && pushToken !== "declined";

  async function handleTogglePush(enabled: boolean) {
    if (enabled) {
      const token = await registerPushToken();
      await savePushToken.savePushToken(token);
    } else {
      await savePushToken.savePushToken("declined");
    }
  }

  function toggle(
    field: "push_new_follower" | "push_activity_like" | "push_review_like" | "push_comment" | "push_recommendation" | "email_weekly_digest",
    value: boolean,
  ) {
    upsert.mutate({ [field]: value } as any);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-2.5 flex-row items-center gap-2 border-b border-border">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft size={24} color={c.t3} strokeWidth={1.6} />
        </Pressable>
        <Text className="font-display-sb text-xl text-text tracking-tight">
          Notificaciones
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <SettingsSection title="Push">
          <SettingsItem
            label="Notificaciones push"
            subtitle={pushEnabled ? "Activas" : "Desactivadas"}
            trailing={
              <SettingsToggle
                on={pushEnabled}
                onChange={handleTogglePush}
                disabled={upsert.isPending}
              />
            }
          />
          <SettingsItem
            label="Nuevos seguidores"
            trailing={
              <SettingsToggle
                on={(prefs?.push_new_follower ?? true) && pushEnabled}
                onChange={(v) => toggle("push_new_follower", v)}
                disabled={!pushEnabled || upsert.isPending}
              />
            }
          />
          <SettingsItem
            label="Me gusta en publicaciones"
            trailing={
              <SettingsToggle
                on={(prefs?.push_activity_like ?? true) && pushEnabled}
                onChange={(v) => toggle("push_activity_like", v)}
                disabled={!pushEnabled || upsert.isPending}
              />
            }
          />
          <SettingsItem
            label="Me gusta en reseñas"
            trailing={
              <SettingsToggle
                on={(prefs?.push_review_like ?? true) && pushEnabled}
                onChange={(v) => toggle("push_review_like", v)}
                disabled={!pushEnabled || upsert.isPending}
              />
            }
          />
          <SettingsItem
            label="Comentarios"
            trailing={
              <SettingsToggle
                on={(prefs?.push_comment ?? true) && pushEnabled}
                onChange={(v) => toggle("push_comment", v)}
                disabled={!pushEnabled || upsert.isPending}
              />
            }
          />
          <SettingsItem
            label="Recomendaciones"
            trailing={
              <SettingsToggle
                on={(prefs?.push_recommendation ?? true) && pushEnabled}
                onChange={(v) => toggle("push_recommendation", v)}
                disabled={!pushEnabled || upsert.isPending}
              />
            }
            separator={false}
          />
        </SettingsSection>

        <SettingsSection title="Email">
          <SettingsItem
            label="Resumen semanal"
            subtitle="Recibe un correo con tu actividad de la semana"
            trailing={
              <SettingsToggle
                on={prefs?.email_weekly_digest ?? false}
                onChange={(v) => toggle("email_weekly_digest", v)}
                disabled={upsert.isPending}
              />
            }
            separator={false}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
